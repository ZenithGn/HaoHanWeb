use std::time::Duration;

use anyhow::{Context, bail};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;

const SLP_TIMEOUT: Duration = Duration::from_secs(3);
const MAX_SLP_JSON_BYTES: usize = 64 * 1024;
const PROTOCOL_VERSION_1_20_4: u32 = 765;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MinecraftServerStatus {
    pub online: bool,
    pub online_players: i64,
    pub max_players: i64,
    pub motd: String,
    pub version: String,
    pub players_list: Vec<String>,
    pub tps: f64,
}

impl MinecraftServerStatus {
    pub fn offline() -> Self {
        Self {
            online: false,
            online_players: 0,
            max_players: 20,
            motd: "Server is offline".to_string(),
            version: "Unknown".to_string(),
            players_list: Vec::new(),
            tps: 0.0,
        }
    }
}

pub fn encode_varint(mut val: u32, buf: &mut Vec<u8>) {
    loop {
        let mut temp = (val & 0x7F) as u8;
        val >>= 7;
        if val != 0 {
            temp |= 0x80;
        }
        buf.push(temp);
        if val == 0 {
            break;
        }
    }
}

pub async fn read_varint<R: AsyncRead + Unpin>(reader: &mut R) -> anyhow::Result<u32> {
    let mut val: u32 = 0;
    let mut shift: u32 = 0;
    loop {
        if shift >= 35 {
            bail!("VarInt exceeds 5 bytes");
        }
        let mut byte = [0u8; 1];
        reader
            .read_exact(&mut byte)
            .await
            .context("Unexpected EOF reading VarInt")?;
        let b = byte[0];
        val |= u32::from(b & 0x7F) << shift;
        if (b & 0x80) == 0 {
            return Ok(val);
        }
        shift += 7;
    }
}

fn build_slp_handshake_and_request(host: &str, port: u16) -> Vec<u8> {
    let host_bytes = host.as_bytes();
    let mut handshake_payload = Vec::with_capacity(16 + host_bytes.len());
    encode_varint(0x00, &mut handshake_payload);
    encode_varint(PROTOCOL_VERSION_1_20_4, &mut handshake_payload);
    encode_varint(host_bytes.len() as u32, &mut handshake_payload);
    handshake_payload.extend_from_slice(host_bytes);
    handshake_payload.extend_from_slice(&port.to_be_bytes());
    encode_varint(1, &mut handshake_payload); // NextState = 1 (Status)

    let mut out = Vec::with_capacity(8 + handshake_payload.len());
    encode_varint(handshake_payload.len() as u32, &mut out);
    out.extend_from_slice(&handshake_payload);

    // Packet 2: Status Request (Length = 1, Packet ID = 0x00)
    out.extend_from_slice(&[0x01, 0x00]);
    out
}

fn extract_motd(description: Option<&Value>) -> String {
    match description {
        Some(Value::String(s)) if !s.is_empty() => s.clone(),
        Some(Value::Object(obj)) => {
            if let Some(text) = obj.get("text").and_then(Value::as_str)
                && !text.is_empty()
            {
                return text.to_string();
            }
            if let Some(extra) = obj.get("extra").and_then(Value::as_array) {
                let joined: String = extra
                    .iter()
                    .filter_map(|part| part.get("text").and_then(Value::as_str))
                    .collect();
                if !joined.is_empty() {
                    return joined;
                }
            }
            "A Minecraft Server".to_string()
        }
        _ => "A Minecraft Server".to_string(),
    }
}

/// Pings a Minecraft Java server via SLP v1.7+ with strict 3s timeouts and 64KB JSON cap.
pub async fn ping_server_checked(host: &str, port: u16) -> anyhow::Result<MinecraftServerStatus> {
    tokio::time::timeout(SLP_TIMEOUT, async {
        let mut stream = TcpStream::connect((host, port))
            .await
            .with_context(|| format!("Failed to connect to Minecraft server {host}:{port}"))?;

        let _ = stream.set_nodelay(true);
        let request_bytes = build_slp_handshake_and_request(host, port);
        stream
            .write_all(&request_bytes)
            .await
            .context("Failed to send SLP handshake + status request")?;
        stream
            .flush()
            .await
            .context("Failed to flush SLP request")?;

        let mut reader = BufReader::new(stream);
        let _packet_len = read_varint(&mut reader).await?;
        let packet_id = read_varint(&mut reader).await?;
        if packet_id != 0x00 {
            bail!("Unexpected SLP packet ID: {packet_id:#x}");
        }

        let json_len = read_varint(&mut reader).await? as usize;
        if json_len == 0 || json_len > MAX_SLP_JSON_BYTES {
            bail!("SLP JSON length out of bounds: {json_len}");
        }

        let mut json_buf = vec![0u8; json_len];
        reader
            .read_exact(&mut json_buf)
            .await
            .context("Failed to read SLP JSON payload")?;

        let parsed: Value =
            serde_json::from_slice(&json_buf).context("Failed to parse SLP JSON payload")?;

        let players_list = parsed
            .pointer("/players/sample")
            .and_then(Value::as_array)
            .map(|items| {
                items
                    .iter()
                    .filter_map(|item| item.get("name").and_then(Value::as_str))
                    .map(ToString::to_string)
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        let online_players = parsed
            .pointer("/players/online")
            .and_then(Value::as_i64)
            .unwrap_or(0);
        let max_players = parsed
            .pointer("/players/max")
            .and_then(Value::as_i64)
            .unwrap_or(20);
        let motd = extract_motd(parsed.get("description"));
        let version = parsed
            .pointer("/version/name")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty())
            .unwrap_or("1.20")
            .to_string();

        Ok(MinecraftServerStatus {
            online: true,
            online_players,
            max_players,
            motd,
            version,
            players_list,
            tps: 20.0,
        })
    })
    .await
    .context("Minecraft SLP ping timed out")?
}

/// Pings a Minecraft server and returns `MinecraftServerStatus::offline()` on any failure.
pub async fn ping_server(host: &str, port: u16) -> MinecraftServerStatus {
    match ping_server_checked(host, port).await {
        Ok(status) => status,
        Err(err) => {
            tracing::warn!(host = %host, port = port, error = %err, "Minecraft Ping failed");
            MinecraftServerStatus::offline()
        }
    }
}
