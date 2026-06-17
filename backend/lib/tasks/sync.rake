namespace :sync do
  desc "Query Minecraft server status and log to database (every 10 min)"
  task log_server_status: :environment do
    puts "Querying Minecraft server status..."
    status = MinecraftPingService.ping
    
    log = ServerStatusLog.create!(
      online_players: status[:online_players],
      max_players: status[:max_players],
      tps: status[:online] ? 20.00 : 0.00
    )
    
    puts "Logged status: #{status[:online_players]}/#{status[:max_players]} online (TPS: #{log.tps}) at #{log.recorded_at}"
  end

  desc "Simulate in-game playtime sync for testing"
  task playtime: :environment do
    puts "Simulating in-game playtime sync..."
    
    Player.find_each do |player|
      # Add random minutes (300 to 1800 seconds) to active players
      next if player.password_hash == 'UNREGISTERED_GHOST'
      
      added_seconds = rand(300..1800)
      player.update!(play_time: player.play_time.to_i + added_seconds)
      puts "Updated player #{player.username} playtime +#{added_seconds}s (Total: #{player.play_time}s)"
    end
    
    puts "Simulated playtime sync finished!"
  end
end
