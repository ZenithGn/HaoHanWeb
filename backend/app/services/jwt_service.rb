class JwtService
  SECRET_KEY = ENV.fetch('JWT_SECRET') { 'super_secret_jwt_key_987' }

  # Encode payload with an expiration time
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  # Decode token and return the payload, or nil if invalid/expired
  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(decoded)
  rescue JWT::DecodeError
    nil
  end
end
