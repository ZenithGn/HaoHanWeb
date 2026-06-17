require 'socket'
require 'json'

class MinecraftPingService
  # Pings the Minecraft server and returns its status
  def self.ping
    host = ENV.fetch('MINECRAFT_HOST') { '127.0.0.1' }
    port = ENV.fetch('MINECRAFT_PORT') { '25565' }.to_i

    begin
      socket = TCPSocket.new(host, port)
      
      # Minecraft SLP protocol v1.7+ handshake + status request
      # 1. Send handshake
      # Protocol: VarInt(Length) | VarInt(PacketID) | VarInt(ProtocolVersion) | String(Host) | UShort(Port) | VarInt(NextState)
      host_bytes = host.encode('UTF-8')
      handshake_data = pack_varint(765) + pack_string(host_bytes) + [port].pack('n') + pack_varint(1)
      handshake_packet = pack_varint(0x00) + handshake_data
      socket.write(pack_varint(handshake_packet.bytesize) + handshake_packet)

      # 2. Send status request
      # Protocol: VarInt(Length) | VarInt(PacketID)
      status_packet = pack_varint(0x00)
      socket.write(pack_varint(status_packet.bytesize) + status_packet)

      # 3. Read status response
      # Protocol: VarInt(Length) | VarInt(PacketID) | VarInt(JSONLength) | String(JSON)
      packet_len = unpack_varint(socket)
      packet_id = unpack_varint(socket)
      
      if packet_id != 0x00
        socket.close
        return offline_status
      end

      json_len = unpack_varint(socket)
      json_data = socket.read(json_len)
      socket.close

      parsed = JSON.parse(json_data)
      
      # Extract online players list
      players_sample = parsed.dig('players', 'sample') || []
      player_names = players_sample.map { |p| p['name'] }

      {
        online: true,
        online_players: parsed.dig('players', 'online') || 0,
        max_players: parsed.dig('players', 'max') || 20,
        motd: parsed.dig('description', 'text') || parsed.dig('description') || "A Minecraft Server",
        version: parsed.dig('version', 'name') || "1.20",
        players_list: player_names,
        tps: 20.00
      }
    rescue => e
      Rails.logger.warn("Minecraft Ping failed to #{host}:#{port}: #{e.message}")
      offline_status
    end
  end

  private

  def self.offline_status
    {
      online: false,
      online_players: 0,
      max_players: 20,
      motd: "Server is offline",
      version: "Unknown",
      players_list: [],
      tps: 0.0
    }
  end

  def self.pack_varint(val)
    bytes = []
    loop do
      temp = val & 0x7F
      val >>= 7
      if val != 0
        temp |= 0x80
      end
      bytes << temp
      break if val == 0
    end
    bytes.pack('C*')
  end

  def self.unpack_varint(socket)
    val = 0
    shift = 0
    loop do
      b = socket.read(1)&.ord
      return 0 if b.nil?
      val |= (b & 0x7F) << shift
      break if (b & 0x80) == 0
      shift += 7
    end
    val
  end

  def self.pack_string(str)
    pack_varint(str.bytesize) + str
  end
end
