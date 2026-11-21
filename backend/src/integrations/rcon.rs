use std::time::Duration;

use thiserror::Error;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;

const RCON_TIMEOUT: Duration = Duration::from_secs(3);
const MAX_RCON_PACKET_LEN: i32 = 65_536;
const TYPE_AUTH: i32 = 3;
const TYPE_EXEC_COMMAND: i32 = 2;
const TYPE_RESPONSE_VALUE: i32 = 0;

#[derive(Debug, Error)]
pub enum RconError {
    #[error("RCON password is not configured")]
    NotConfigured,
    #[error("RCON authentication failed")]
    AuthFailed,
    #[error("RCON I/O or protocol error: {0}")]
    Transport(#[from] anyhow::Error),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RconPacket {
    pub id: i32,
    pub packet_type: i32,
    pub payload: String,
}

/// Encodes a Source RCON packet with little-endian `i32` header fields and 2 null terminators.
pub fn encode_rcon_packet(id: i32, packet_type: i32, payload: &str) -> Vec<u8> {
    let payload_bytes = payload.as_bytes();
    let body_len = 4i32 + 4i32 + (payload_bytes.len() as i32) + 2i32;

    let mut buf = Vec::with_capacity((body_len as usize) + 4);
    buf.extend_from_slice(&body_len.to_le_bytes());
    buf.extend_from_slice(&id.to_le_bytes());
    buf.extend_from_slice(&packet_type.to_le_bytes());
    buf.extend_from_slice(payload_bytes);
    buf.extend_from_slice(&[0u8, 0u8]);
    buf
}

/// Decodes a Source RCON packet from an async reader using `i32::from_le_bytes`.
pub async fn read_rcon_packet<R: AsyncRead + Unpin>(reader: &mut R) -> anyhow::Result<RconPacket> {
    let mut len_buf = [0u8; 4];
    reader.read_exact(&mut len_buf).await?;
    let length = i32::from_le_bytes(len_buf);
    if !(10..=MAX_RCON_PACKET_LEN).contains(&length) {
        anyhow::bail!("Invalid RCON packet length: {length}");
    }

    let mut body = vec![0u8; length as usize];
    reader.read_exact(&mut body).await?;

    let id = i32::from_le_bytes(body[0..4].try_into().expect("slice len 4"));
    let packet_type = i32::from_le_bytes(body[4..8].try_into().expect("slice len 4"));
    let payload_end = body.len().saturating_sub(2);
    let payload = String::from_utf8_lossy(&body[8..payload_end])
        .trim_end_matches('\0')
        .to_string();

    Ok(RconPacket {
        id,
        packet_type,
        payload,
    })
}

/// Persistent, reconnecting Source RCON TCP client with 3s I/O timeouts.
pub struct RconClient {
    host: String,
    port: u16,
    password: String,
    next_id: i32,
    stream: Option<BufReader<TcpStream>>,
}

impl RconClient {
    pub fn new(host: impl Into<String>, port: u16, password: impl Into<String>) -> Self {
        Self {
            host: host.into(),
            port,
            password: password.into(),
            next_id: 2,
            stream: None,
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.password.trim().is_empty()
    }

    pub async fn disconnect(&mut self) {
        if let Some(mut reader) = self.stream.take() {
            let _ = reader.get_mut().shutdown().await;
        }
    }

    async fn connect_and_auth(&mut self) -> Result<(), RconError> {
        if !self.is_configured() {
            return Err(RconError::NotConfigured);
        }

        let host = self.host.clone();
        let port = self.port;
        let password = self.password.clone();

        let reader = tokio::time::timeout(RCON_TIMEOUT, async {
            let mut stream = TcpStream::connect((host.as_str(), port))
                .await
                .map_err(|e| anyhow::anyhow!("RCON connect to {host}:{port} failed: {e}"))?;
            let _ = stream.set_nodelay(true);

            let auth_pkt = encode_rcon_packet(1, TYPE_AUTH, &password);
            stream
                .write_all(&auth_pkt)
                .await
                .map_err(|e| anyhow::anyhow!("RCON auth write failed: {e}"))?;
            stream
                .flush()
                .await
                .map_err(|e| anyhow::anyhow!("RCON auth flush failed: {e}"))?;

            let mut reader = BufReader::new(stream);
            let first = read_rcon_packet(&mut reader).await?;
            if first.id == -1 {
                return Ok::<_, RconError>(Err(RconError::AuthFailed));
            }

            // Some Source/Minecraft RCON servers send an empty RESPONSE_VALUE (type 0)
            // before AUTH_RESPONSE (type 2). Read the second packet if so.
            if first.packet_type == TYPE_RESPONSE_VALUE {
                let second = read_rcon_packet(&mut reader).await?;
                if second.id == -1 {
                    return Ok(Err(RconError::AuthFailed));
                }
            }

            Ok(Ok(reader))
        })
        .await
        .map_err(|_| RconError::Transport(anyhow::anyhow!("RCON connect/auth timed out")))??;

        match reader {
            Ok(r) => {
                self.stream = Some(r);
                Ok(())
            }
            Err(auth_err) => Err(auth_err),
        }
    }

    async fn send_command_on_stream(&mut self, command: &str) -> Result<String, RconError> {
        let req_id = self.next_id;
        self.next_id = if self.next_id >= i32::MAX - 1 {
            2
        } else {
            self.next_id + 1
        };

        let reader = self
            .stream
            .as_mut()
            .ok_or_else(|| RconError::Transport(anyhow::anyhow!("RCON stream not connected")))?;

        tokio::time::timeout(RCON_TIMEOUT, async {
            let pkt = encode_rcon_packet(req_id, TYPE_EXEC_COMMAND, command);
            reader
                .get_mut()
                .write_all(&pkt)
                .await
                .map_err(|e| anyhow::anyhow!("RCON command write failed: {e}"))?;
            reader
                .get_mut()
                .flush()
                .await
                .map_err(|e| anyhow::anyhow!("RCON command flush failed: {e}"))?;

            let resp = read_rcon_packet(reader).await?;
            if resp.id == -1 {
                return Ok::<_, RconError>(Err(RconError::AuthFailed));
            }
            Ok(Ok(resp.payload.trim().to_string()))
        })
        .await
        .map_err(|_| RconError::Transport(anyhow::anyhow!("RCON command timed out")))??
    }

    /// Executes a command, maintaining a persistent connection and reconnecting once if dropped.
    pub async fn execute(&mut self, command: &str) -> Result<String, RconError> {
        if !self.is_configured() {
            return Err(RconError::NotConfigured);
        }

        if self.stream.is_none() {
            self.connect_and_auth().await?;
        }

        match self.send_command_on_stream(command).await {
            Ok(resp) => Ok(resp),
            Err(RconError::AuthFailed) => {
                self.stream = None;
                Err(RconError::AuthFailed)
            }
            Err(_transport_err) => {
                // Connection may have gone stale; reconnect once and retry.
                self.stream = None;
                self.connect_and_auth().await?;
                match self.send_command_on_stream(command).await {
                    Ok(resp) => Ok(resp),
                    Err(err) => {
                        self.stream = None;
                        Err(err)
                    }
                }
            }
        }
    }
}

/// One-shot convenience wrapper for executing a single RCON command.
pub async fn execute_once(
    host: &str,
    port: u16,
    password: &str,
    command: &str,
) -> Result<String, RconError> {
    let mut client = RconClient::new(host, port, password);
    let result = client.execute(command).await;
    client.disconnect().await;
    result
}
