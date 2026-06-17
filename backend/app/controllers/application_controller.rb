class ApplicationController < ActionController::API
  attr_reader :current_user

  protected

  def authenticate_user!
    header = request.headers['Authorization']
    token = header.split(' ').last if header.present?

    if token
      decoded = JwtService.decode(token)
      if decoded
        @current_user = Player.find_by(id: decoded[:user_id])
      end
    end

    unless @current_user
      render json: { error: 'Unauthorized' }, status: :unauthorized
    end
  end
end
