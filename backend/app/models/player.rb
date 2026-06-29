require 'digest'
require 'securerandom'

class Player < ApplicationRecord
  self.table_name = 'players'

  has_many :donations, dependent: :destroy

  validates :username, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: 16 }
  validates :password_hash, presence: true
  validates :uuid, uniqueness: true, allow_nil: true
  validates :discord_id, uniqueness: true, allow_nil: true
  
  # Validations for email (only required/validated for registered web accounts)
  validates :email, presence: true, 
                    uniqueness: { case_sensitive: false, allow_nil: true }, 
                    format: { with: URI::MailTo::EMAIL_REGEXP, message: "không đúng định dạng" },
                    if: :web_account?

  def web_account?
    password_hash != 'UNREGISTERED_GHOST'
  end

  def discord_only_account?
    password_hash == 'DISCORD_AUTH'
  end

  before_validation :set_offline_uuid, on: :create

  # Helper to generate AuthMe SHA256 compatible hash
  # Format: $SHA$salt$hash where hash = SHA256(SHA256(password) + salt)
  def self.hash_password(password, salt = SecureRandom.hex(8))
    first_hash = Digest::SHA256.hexdigest(password)
    second_hash = Digest::SHA256.hexdigest(first_hash + salt)
    "$SHA$#{salt}$#{second_hash}"
  end

  # Verify password against stored AuthMe SHA256 hash
  def valid_password?(password)
    return false if password_hash == 'UNREGISTERED_GHOST'
    return false if password_hash == 'DISCORD_AUTH'
    return false if password_hash.blank?

    parts = password_hash.split('$')
    # parts[0] is empty (because string starts with $)
    # parts[1] is 'SHA'
    # parts[2] is the salt
    # parts[3] is the hash
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
