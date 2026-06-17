require 'socket'

class RconService
  # Commands execution helper
  def self.execute(command)
    host = ENV.fetch('RCON_HOST') { '127.0.0.1' }
    port = ENV.fetch('RCON_PORT') { '25575' }.to_i
    password = ENV['RCON_PASSWORD']

    if password.blank?
      Rails.logger.warn("RCON password is blank, skipping command execution: #{command}")
      return "RCON not configured (No password)"
    end

    begin
      socket = TCPSocket.new(host, port)
      
      # 1. Login packet
      # Request ID = 1, Type = 3 (Login)
      send_packet(socket, 1, 3, password)
      
      # Read auth response
      id, type, payload = read_packet(socket)
      if id == -1
        socket.close
        Rails.logger.error("RCON Auth Failed")
        return "RCON Auth Failed"
      end

      # 2. Command packet
      # Request ID = 2, Type = 2 (Command)
      send_packet(socket, 2, 2, command)
      
      # Read command response
      id, type, payload = read_packet(socket)
      
      socket.close
      
      Rails.logger.info("RCON Command Executed: '#{command}' -> Response: '#{payload.strip}'")
      payload.strip
    rescue => e
      Rails.logger.error("RCON Error executing '#{command}': #{e.message}")
      "RCON Error: #{e.message}"
    end
  end

  private

  # Write RCON Packet to Socket
  # Packet Structure: Length (4 bytes) | ID (4 bytes) | Type (4 bytes) | Payload (string) | Padding (2 null bytes)
  def self.send_packet(socket, id, type, payload)
    payload_bytes = payload.encode('UTF-8') + "\x00"
    length = 4 + 4 + payload_bytes.bytesize + 1 # 4 bytes ID + 4 bytes Type + payload length + 1 padding byte
    
    # Pack parameters as little-endian 32-bit integers ('V')
    header = [length, id, type].pack('VVV')
    padding = "\x00"
    
    socket.write(header + payload_bytes + padding)
  end

  # Read RCON Packet from Socket
  def self.read_packet(socket)
    length_bytes = socket.read(4)
    return [-1, 0, ""] if length_bytes.nil?
    
    length = length_bytes.unpack1('V')
    packet_data = socket.read(length)
    return [-1, 0, ""] if packet_data.nil?
    
    # Unpack ID and Type
    id = packet_data[0..3].unpack1('V')
    type = packet_data[4..7].unpack1('V')
    
    # Extract payload (drop the padding bytes)
    payload = packet_data[8..-3] || ""
    
    [id, type, payload]
  end
end
