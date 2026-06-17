class Ban < ApplicationRecord
  self.table_name = 'bans'

  validates :player_uuid, presence: true
  validates :admin_identifier, presence: true
  validates :reason, presence: true
  validates :status, presence: true, inclusion: { in: %w[ACTIVE LIFTED] }

  scope :active, -> { where(status: 'ACTIVE') }
  scope :lifted, -> { where(status: 'LIFTED') }
end
