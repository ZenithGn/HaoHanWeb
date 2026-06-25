class Api::ServerStatusController < ApplicationController
  before_action :authenticate_game_server!, only: [:sync_playtime]

  # GET /api/server/status
  def status
    res = MinecraftPingService.ping
    render json: res, status: :ok
  end

  # POST /api/game/sync-playtime
  def sync_playtime
    players_data = params[:players]

    if players_data.nil?
      # Try single player parsing
      uuid = params[:uuid]&.strip
      playtime = params[:playtime] || params[:playtime_seconds]
      username = params[:username]&.strip

      if uuid.present? && playtime.present?
        players_data = [{ 'uuid' => uuid, 'username' => username, 'playtime' => playtime.to_i }]
      end
    end

    if players_data.blank?
      return render json: { error: 'Không tìm thấy dữ liệu người chơi!' }, status: :bad_request
    end

    updated_count = 0
    errors = []

    ActiveRecord::Base.transaction do
      players_data.each do |p|
        p_uuid = p['uuid']&.strip
        p_username = p['username']&.strip
        p_playtime = p['playtime'] || p['playtime_seconds']

        next if p_uuid.blank? && p_username.blank?
        next if p_playtime.nil?

        # Find player by UUID first, then username
        player = nil
        player = Player.find_by(uuid: p_uuid) if p_uuid.present?
        player ||= Player.find_by(username: p_username) if p_username.present?

        if player
          updates = { play_time: p_playtime.to_i }
          if player.uuid.blank? && p_uuid.present?
            updates[:uuid] = p_uuid
            updates[:is_linked] = true if player.discord_id.present?
          end
          player.update!(updates)

          if updates.key?(:uuid)
            ActionCable.server.broadcast("roles_channel_#{player.id}", {
              id: player.id,
              username: player.username,
              email: player.email,
              uuid: player.uuid,
              role: player.role,
              is_linked: player.is_linked ? 1 : 0,
              discord_id: player.discord_id,
              avatar_url: player.avatar_url,
              play_time: player.play_time
            }) rescue nil
          end

          updated_count += 1
        else
          # Create a ghost profile if they don't exist yet but play on server
          # This allows pre-tracking playtime for in-game players!
          # But wait, we only need to sync playtime for registered web players, but creating a ghost
          # profile here is also useful. Let's create it if they don't exist yet so leaderboards work correctly!
          # We check if we can create it
          begin
            Player.create!(
              username: p_username || "Player_#{SecureRandom.hex(4)}",
              uuid: p_uuid,
              password_hash: 'UNREGISTERED_GHOST', # Ghost password
              play_time: p_playtime.to_i
            )
            updated_count += 1
          rescue => e
            errors << "Error creating profile for #{p_username}: #{e.message}"
          end
        end
      end
    end

    render json: {
      message: "Đồng bộ thời gian chơi thành công!",
      processed_players: updated_count,
      errors: errors
    }, status: :ok
  end

  private

  def authenticate_game_server!
    token = request.headers['X-Game-Server-Token']
    server_token = ENV.fetch('GAME_SERVER_TOKEN') { 'super_secure_server_token_123' }

    if token.blank? || !ActiveSupport::SecurityUtils.secure_compare(token, server_token)
      render json: { error: 'Unauthorized Game Server' }, status: :unauthorized
    end
  end
end
