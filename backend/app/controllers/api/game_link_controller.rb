class Api::GameLinkController < ApplicationController
  before_action :authenticate_user!, only: [:link]
  before_action :authenticate_game_server!, only: [:generate_link_code]

  # POST /api/game/generate-link-code (Called by Minecraft plugin/server)
  def generate_link_code
    username = params[:username]&.strip
    uuid = params[:uuid]&.strip

    if username.blank? || uuid.blank?
      return render json: { error: 'Username và UUID không được để trống!' }, status: :bad_request
    end

    # Generate a random 6-character uppercase alphanumeric code
    # Excluding ambiguous characters like O, 0, I, 1 for better user experience
    charset = %w{A B C D E F G H J K L M N P Q R S T U V W X Y Z 2 3 4 5 6 7 8 9}
    code = (0...6).map { charset.to_a[SecureRandom.random_number(charset.size)] }.join

    # Store code in cache for 5 minutes
    Rails.cache.write("link_code:#{code}", { username: username, uuid: uuid }, expires_in: 5.minutes)

    render json: { code: code, message: 'Mã liên kết được sinh thành công!' }, status: :ok
  end

  # POST /api/auth/link (Called by web user)
  def link
    code = params[:code]&.strip&.upcase

    if code.blank?
      return render json: { error: 'Vui lòng cung cấp mã liên kết!' }, status: :bad_request
    end

    game_data = Rails.cache.read("link_code:#{code}")
    if game_data.nil?
      return render json: { error: 'Mã liên kết không hợp lệ hoặc đã hết hạn!' }, status: :bad_request
    end

    game_username = game_data[:username]
    game_uuid = game_data[:uuid]

    # Run merging transaction
    ActiveRecord::Base.transaction do
      # 1. Check if this UUID is already associated with any player record
      ghost_player = Player.find_by(uuid: game_uuid) || Player.find_by(username: game_username)

      if ghost_player
        if ghost_player.id == current_user.id
          # Already the same user
          current_user.update!(uuid: game_uuid, is_linked: true)
        elsif ghost_player.password_hash == 'UNREGISTERED_GHOST'
          # Merge Ghost Profile into current_user
          
          # Merge donations: update player_id for all donations
          Donation.where(player_id: ghost_player.id).update_all(player_id: current_user.id)

          # Add donations value
          new_total_donated = current_user.total_donated.to_f + ghost_player.total_donated.to_f
          
          # Sync details: role, playtime, discord_id, avatar
          new_role = current_user.role == 'default' ? ghost_player.role : current_user.role
          new_playtime = [current_user.play_time.to_i, ghost_player.play_time.to_i].max
          new_discord_id = current_user.discord_id.blank? ? ghost_player.discord_id : current_user.discord_id
          new_avatar_url = current_user.avatar_url.blank? ? ghost_player.avatar_url : current_user.avatar_url

          current_user.update!(
            uuid: game_uuid,
            username: game_username, # Sync username to match game name exactly
            total_donated: new_total_donated,
            role: new_role,
            play_time: new_playtime,
            discord_id: new_discord_id,
            avatar_url: new_avatar_url,
            is_linked: true
          )

          # Delete ghost profile
          ghost_player.destroy!
        else
          # The game account is linked to another web account with a valid password
          return render json: { error: 'Tài khoản game này đã được liên kết với một tài khoản web khác!' }, status: :conflict
        end
      else
        # No ghost profile found, just link UUID to current_user
        current_user.update!(uuid: game_uuid, is_linked: true)
      end

      # Clear code from cache after success
      Rails.cache.delete("link_code:#{code}")

      render json: {
        message: 'Liên kết tài khoản game thành công!',
        user: {
          id: current_user.id,
          username: current_user.username,
          uuid: current_user.uuid,
          is_linked: current_user.is_linked,
          total_donated: current_user.total_donated,
          play_time: current_user.play_time
        }
      }, status: :ok
    end
  rescue => e
    render json: { error: "Lỗi trong quá trình gộp tài khoản: #{e.message}" }, status: :unprocessable_entity
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
