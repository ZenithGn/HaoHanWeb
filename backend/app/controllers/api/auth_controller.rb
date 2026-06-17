class Api::AuthController < ApplicationController
  # POST /api/auth/register
  def register
    username = params[:username]&.strip
    password = params[:password]

    if username.blank? || password.blank?
      return render json: { error: 'Tên nhân vật và mật khẩu không được để trống!' }, status: :bad_request
    end

    if username.length > 16
      return render json: { error: 'Tên nhân vật không được vượt quá 16 ký tự!' }, status: :bad_request
    end

    if password.length < 6
      return render json: { error: 'Mật khẩu phải từ 6 ký tự trở lên!' }, status: :bad_request
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
        ghost_player.password_hash = Player.hash_password(password)
        ghost_player.is_linked = true
        if ghost_player.save
          DiscordService.notify_new_user(ghost_player) rescue nil
          token = JwtService.encode(user_id: ghost_player.id)
          return render json: {
            message: 'Đăng ký tài khoản web thành công (Liên kết tài khoản game có sẵn)!',
            token: token,
            user: { id: ghost_player.id, username: ghost_player.username, uuid: ghost_player.uuid, role: ghost_player.role }
          }, status: :ok
        else
          return render json: { error: 'Lỗi khi kích hoạt tài khoản game!' }, status: :unprocessable_entity
        end
      else
        return render json: { error: 'Tên nhân vật đã được đăng ký tài khoản web!' }, status: :bad_request
      end
    end

    # Create new primary web user
    player = Player.new(
      username: username,
      password_hash: Player.hash_password(password),
      is_linked: true # Mark as active web account
    )

    if player.save
      DiscordService.notify_new_user(player) rescue nil
      token = JwtService.encode(user_id: player.id)
      render json: {
        message: 'Đăng ký tài khoản thành công!',
        token: token,
        user: { id: player.id, username: player.username, uuid: player.uuid, role: player.role }
      }, status: :created
    else
      render json: { error: player.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # POST /api/auth/login
  def login
    username = params[:username]&.strip
    password = params[:password]

    if username.blank? || password.blank?
      return render json: { error: 'Tên nhân vật và mật khẩu không được để trống!' }, status: :bad_request
    end

    # Case insensitive lookup for SQL Server
    player = Player.find_by(username: username)

    if player && player.valid_password?(password)
      token = JwtService.encode(user_id: player.id)
      render json: {
        message: 'Đăng nhập thành công!',
        token: token,
        user: { id: player.id, username: player.username, uuid: player.uuid, role: player.role }
      }, status: :ok
    else
      render json: { error: 'Tên đăng nhập hoặc mật khẩu không chính xác!' }, status: :unauthorized
    end
  end
end
