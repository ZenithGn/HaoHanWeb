class Api::DiscordController < ApplicationController
  before_action :authenticate_user!, only: [:sync]
  before_action :authenticate_bot_or_server!, only: [:role_update]

  # GET /api/auth/discord/url
  def url
    response.headers['Cache-Control'] = 'no-store'
    state = discord_link_state_from_auth_header
    return render json: { error: 'Unauthorized' }, status: :unauthorized if state.blank?

    authorize_url = DiscordOauthService.authorize_url(state)
    render json: { url: authorize_url }, status: :ok
  end

  # POST /api/auth/discord/callback
  # Authenticated callback that links discord to the current logged-in user
  def callback
    code = params[:code]&.strip
    if code.blank?
      return render json: { error: 'Không tìm thấy mã xác thực OAuth!' }, status: :bad_request
    end

    @current_user = user_from_auth_header || user_from_discord_state
    unless current_user
      return render json: { error: 'Unauthorized' }, status: :unauthorized
    end

    begin
      # 1. Exchange OAuth code for access token
      token_data = DiscordOauthService.exchange_code(code)
      access_token = token_data['access_token']

      # 2. Get Discord User profile
      discord_profile = DiscordOauthService.fetch_user_profile(access_token)
      discord_id = discord_profile['id']
      discord_username = discord_profile['username']
      avatar_hash = discord_profile['avatar']

      # 3. Check if they are in the Discord server (and get roles)
      # This raises "NOT_IN_SERVER" if they are not in the guild.
      discord_roles = DiscordOauthService.fetch_guild_member_roles(discord_id)

      # 4. Construct avatar URL & upload to Cloudinary
      discord_avatar_url = if avatar_hash.present?
                             "https://cdn.discordapp.com/avatars/#{discord_id}/#{avatar_hash}.png"
                           else
                             "https://cdn.discordapp.com/embed/avatars/#{(discord_id.to_i >> 22) % 6}.png"
                           end
      cloudinary_avatar_url = CloudinaryService.upload_image(discord_avatar_url)

      # 5. Resolve their highest role on the Discord server
      highest_role = DiscordOauthService.determine_highest_role(discord_roles)

      # 6. Check unique constraint for discord_id in database:
      existing_discord_user = Player.find_by(discord_id: discord_id)
      if existing_discord_user && existing_discord_user.id != current_user.id
        if existing_discord_user.password_hash != 'UNREGISTERED_GHOST'
          return render json: { error: 'Tài khoản Discord này đã được liên kết với một tài khoản web khác!' }, status: :conflict
        end
      end

      # 7. Core linking/merging logic:
      # Find another player record with the same username (case-insensitive) OR same discord_id that has a uuid
      minecraft_player = Player.where.not(id: current_user.id)
                               .where("uuid IS NOT NULL")
                               .find_by("LOWER(username) = ? OR discord_id = ?", current_user.username.downcase, discord_id)

      ActiveRecord::Base.transaction do
        if minecraft_player
          # Save game details before destroying the ghost profile
          game_username = minecraft_player.username
          game_uuid = minecraft_player.uuid
          game_playtime = minecraft_player.play_time.to_i

          # Merge donations
          Donation.where(player_id: minecraft_player.id).update_all(player_id: current_user.id)
          new_total_donated = current_user.total_donated.to_f + minecraft_player.total_donated.to_f

          # Delete duplicate Minecraft player record first to free up the username
          minecraft_player.destroy!

          # Update current_user details
          current_user.update!(
            uuid: game_uuid,
            username: game_username, # Sync username to match game name exactly
            play_time: [current_user.play_time.to_i, game_playtime].max,
            total_donated: new_total_donated,
            discord_id: discord_id,
            avatar_url: cloudinary_avatar_url,
            role: highest_role,
            is_linked: true # Mark fully linked
          )
        else
          # No Minecraft player record found yet
          has_minecraft_uuid = current_user.uuid.present?
          current_user.update!(
            discord_id: discord_id,
            avatar_url: cloudinary_avatar_url,
            role: highest_role,
            is_linked: has_minecraft_uuid
          )
        end
      end

      # Broadcast update via Action Cable
      broadcast_player_update(current_user)

      render json: {
        message: 'Liên kết Discord thành công!',
        token: JwtService.encode(user_id: current_user.id),
        user: serialize_user(current_user)
      }, status: :ok

    rescue => e
      if e.message == "NOT_IN_SERVER"
        render json: { error: 'Bạn phải tham gia server Discord của Hảo Hán SMP trước khi liên kết!' }, status: :forbidden
      else
        render json: { error: "Lỗi liên kết Discord: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end

  # POST /api/auth/discord/sync
  # Manual sync endpoint for logged-in users to update their roles and avatar
  def sync
    if current_user.discord_id.blank?
      return render json: { error: 'Tài khoản chưa được liên kết với Discord!' }, status: :bad_request
    end

    begin
      discord_roles = DiscordOauthService.fetch_guild_member_roles(current_user.discord_id)
      highest_role = DiscordOauthService.determine_highest_role(discord_roles)

      # Re-fetch Discord profile to update avatar
      bot_token = ENV['DISCORD_BOT_TOKEN']
      avatar_url = current_user.avatar_url
      if bot_token.present?
        response = Faraday.get("https://discord.com/api/v10/users/#{current_user.discord_id}") do |req|
          req.headers['Authorization'] = "Bot #{bot_token}"
        end
        if response.success?
          user_data = JSON.parse(response.body)
          avatar_hash = user_data['avatar']
          discord_avatar_url = if avatar_hash.present?
                                 "https://cdn.discordapp.com/avatars/#{current_user.discord_id}/#{avatar_hash}.png"
                               else
                                 "https://cdn.discordapp.com/embed/avatars/#{(current_user.discord_id.to_i >> 22) % 6}.png"
                               end
          avatar_url = CloudinaryService.upload_image(discord_avatar_url)
        end
      end

      current_user.update!(role: highest_role, avatar_url: avatar_url)
      
      # Broadcast updated player details via Action Cable
      broadcast_player_update(current_user)

      render json: {
        message: 'Đồng bộ thông tin Discord thành công!',
        user: serialize_user(current_user)
      }, status: :ok
    rescue => e
      if e.message == "NOT_IN_SERVER"
        render json: { error: 'Không thể tìm thấy bạn trong server Discord của Hảo Hán SMP. Hãy chắc chắn bạn đã tham gia server!' }, status: :forbidden
      else
        render json: { error: "Lỗi đồng bộ: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end

  # POST /api/discord/role-update
  # Webhook endpoint for the Discord bot to notify Rails when member roles change
  def role_update
    discord_id = params[:discord_id]&.strip
    role_names = params[:roles] # Expecting array of role names

    if discord_id.blank?
      return render json: { error: 'Thiếu discord_id!' }, status: :bad_request
    end

    player = Player.find_by(discord_id: discord_id)
    unless player
      return render json: { error: 'Không tìm thấy người chơi liên kết với Discord ID này!' }, status: :not_found
    end

    # If role_names are not passed, we fetch them via API
    if role_names.nil?
      begin
        role_names = DiscordOauthService.fetch_guild_member_roles(discord_id)
      rescue => e
        return render json: { error: "Lỗi lấy roles của member: #{e.message}" }, status: :unprocessable_entity
      end
    end

    highest_role = DiscordOauthService.determine_highest_role(role_names)
    player.update!(role: highest_role)

    # Broadcast updated details via Action Cable
    broadcast_player_update(player)

    render json: {
      message: 'Cập nhật role thành công!',
      player: { id: player.id, username: player.username, role: player.role }
    }, status: :ok
  end

  private

  def serialize_user(player)
    {
      id: player.id,
      username: player.username,
      email: player.email,
      uuid: player.uuid,
      role: player.role,
      is_linked: player.is_linked ? 1 : 0,
      discord_id: player.discord_id,
      avatar_url: player.avatar_url,
      play_time: player.play_time
    }
  end

  def broadcast_player_update(player)
    # Broadcast to RolesChannel for this user
    ActionCable.server.broadcast("roles_channel_#{player.id}", serialize_user(player))
  end

  def authenticate_bot_or_server!
    token = request.headers['Authorization']&.split(' ')&.last
    server_token = ENV.fetch('GAME_SERVER_TOKEN') { 'super_secure_server_token_123' }

    if token.blank? || !ActiveSupport::SecurityUtils.secure_compare(token, server_token)
      render json: { error: 'Unauthorized Bot/Server' }, status: :unauthorized
    end
  end

  def discord_link_state_from_auth_header
    user = user_from_auth_header
    return nil unless user

    JwtService.encode({ user_id: user.id, purpose: 'discord_link' }, 10.minutes.from_now)
  end

  def user_from_auth_header
    header = request.headers['Authorization']
    token = header.split(' ').last if header.present?
    decoded = JwtService.decode(token) if token.present?
    Player.find_by(id: decoded[:user_id]) if decoded
  end

  def user_from_discord_state
    decoded = JwtService.decode(params[:state].to_s)
    return nil unless decoded && decoded[:purpose] == 'discord_link'

    Player.find_by(id: decoded[:user_id])
  end
end
