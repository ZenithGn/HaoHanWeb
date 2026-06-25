class Api::AuthController < ApplicationController
  # POST /api/auth/register
  def register
    puts "DEBUG: DB_HOST = #{ENV['DB_HOST'].inspect}"
    begin
      puts "DEBUG: DB CONFIG = #{ActiveRecord::Base.connection_db_config.configuration_hash.inspect}"
    rescue => e
      puts "DEBUG: Failed to inspect DB config: #{e.message}"
    end

    username = params[:username]&.strip
    email = params[:email]&.strip
    password = params[:password]

    if username.blank? || email.blank? || password.blank?
      return render json: { error: 'Tên nhân vật, email và mật khẩu không được để trống!' }, status: :bad_request
    end

    if username.length > 16
      return render json: { error: 'Tên nhân vật không được vượt quá 16 ký tự!' }, status: :bad_request
    end

    if password.length < 6
      return render json: { error: 'Mật khẩu phải từ 6 ký tự trở lên!' }, status: :bad_request
    end

    # Check if email is already registered
    if Player.where.not(password_hash: 'UNREGISTERED_GHOST').exists?(email: email)
      return render json: { error: 'Địa chỉ email này đã được sử dụng!' }, status: :bad_request
    end

    # Check if user already exists
    if Player.exists?(username: username)
      # Wait! If there is a Ghost Profile (created by donation before web registration)
      # with password_hash = 'UNREGISTERED_GHOST', the user should be allowed to "claim" it!
      # But wait! If they claim it, they register a password for it.
      # Let's check if there is an unregistered ghost profile with this username:
      ghost_player = Player.find_by(username: username)
      if ghost_player && ghost_player.password_hash == 'UNREGISTERED_GHOST'
        # Claim this profile: set password, link it
        ghost_player.email = email
        ghost_player.password_hash = Player.hash_password(password)
        ghost_player.is_linked = false
        if ghost_player.save
          DiscordService.notify_new_user(ghost_player) rescue nil
          token = JwtService.encode(user_id: ghost_player.id)
          return render json: {
            message: 'Đăng ký tài khoản web thành công (Liên kết tài khoản game có sẵn)!',
            token: token,
            user: { id: ghost_player.id, username: ghost_player.username, email: ghost_player.email, uuid: ghost_player.uuid, role: ghost_player.role, is_linked: ghost_player.is_linked ? 1 : 0 }
          }, status: :ok
        else
          return render json: { error: ghost_player.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      else
        return render json: { error: 'Tên nhân vật đã được đăng ký tài khoản web!' }, status: :bad_request
      end
    end

    # Create new primary web user
    player = Player.new(
      username: username,
      email: email,
      password_hash: Player.hash_password(password),
      is_linked: false
    )

    if player.save
      DiscordService.notify_new_user(player) rescue nil
      token = JwtService.encode(user_id: player.id)
      render json: {
        message: 'Đăng ký tài khoản thành công!',
        token: token,
        user: { 
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
      }, status: :created
    else
      render json: { error: player.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # POST /api/auth/login
  def login
    username_or_email = params[:username]&.strip
    password = params[:password]

    if username_or_email.blank? || password.blank?
      return render json: { error: 'Tên nhân vật/Email và mật khẩu không được để trống!' }, status: :bad_request
    end

    # Case insensitive lookup for SQL Server (either by email or username)
    player = if username_or_email.include?('@')
               Player.find_by(email: username_or_email)
             else
               Player.find_by(username: username_or_email)
             end

    if player && player.valid_password?(password)
      token = JwtService.encode(user_id: player.id)
      render json: {
        message: 'Đăng nhập thành công!',
        token: token,
        user: { 
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
      }, status: :ok
    else
      render json: { error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' }, status: :unauthorized
    end
  end
end
