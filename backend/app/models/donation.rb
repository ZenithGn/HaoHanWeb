class Donation < ApplicationRecord
  self.table_name = 'donations'

  belongs_to :player
  has_one :card_detail, foreign_key: :donation_id, dependent: :destroy

  validates :method, presence: true, inclusion: { in: %w[PAYOS CARD] }
  validates :amount, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :tx_ref, presence: true, uniqueness: true
  validates :status, presence: true, inclusion: { in: %w[PENDING SUCCESS FAILED] }

  # Scopes
  scope :pending, -> { where(status: 'PENDING') }
  scope :success, -> { where(status: 'SUCCESS') }
  scope :failed, -> { where(status: 'FAILED') }
end
