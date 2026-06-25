require 'digest'
require 'securerandom'

class Player < ApplicationRecord
  self.table_name = 'players'

  has_many :donations, dependent: :destroy

  validates :username, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: 16 }
  validates :password_hash, presence: true
  validates :uuid, uniqueness: true, allow_nil: true
  validates :discord_id, uniqueness: true, allow_nil: true
  validates :email, uniqueness: { case_sensitive: false }, allow_nil: true, format: { with: URI::MailTo::EMAIL_REGEXP }, if: -> { email.present? }
  validates :email, presence: true, if: :is_linked

  before_validation :set_offline_uuid, on: :create

  # Helper to generate BCrypt password hash
  def self.hash_password(password)
    BCrypt::Password.create(password).to_s
  end

  # Verify password against stored hash (supports both BCrypt and AuthMe SHA256 legacy format)
  def valid_password?(password)
    return false if password_hash == 'UNREGISTERED_GHOST'
    return false if password_hash.blank?

    # Check if it is a BCrypt hash
    if password_hash.start_with?('$2a$') || password_hash.start_with?('$2b$') || password_hash.start_with?('$2y$')
      begin
        return BCrypt::Password.new(password_hash) == password
      rescue BCrypt::Errors::InvalidHash
        return false
      end
    end

    # Fallback to AuthMe SHA256 legacy format
    parts = password_hash.split('$')
    return false unless parts[1] == 'SHA' && parts[2].present? && parts[3].present?

    salt = parts[2]
    expected_hash = parts[3]

    first_hash = Digest::SHA256.hexdigest(password)
    calculated_hash = Digest::SHA256.hexdigest(first_hash + salt)

    ActiveSupport::SecurityUtils.secure_compare(calculated_hash, expected_hash)
  end

  # Helper to generate Offline UUID
  def self.offline_uuid(username)
    return nil if username.blank?
    hash = Digest::MD5.digest("OfflinePlayer:#{username}")
    bytes = hash.bytes
    bytes[6] = (bytes[6] & 0x0f) | 0x30 # Set version to 3
    bytes[8] = (bytes[8] & 0x3f) | 0x80 # Set variant to IETF
    hex = bytes.map { |b| "%02x" % b }.join
    "#{hex[0..7]}-#{hex[8..11]}-#{hex[12..15]}-#{hex[16..19]}-#{hex[20..31]}"
  end

  private

  def set_offline_uuid
    if uuid.blank? && username.present?
      self.uuid = self.class.offline_uuid(username)
    end
  end
end
