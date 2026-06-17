class CardDetail < ApplicationRecord
  self.table_name = 'card_details'
  self.primary_key = 'donation_id'

  belongs_to :donation, foreign_key: :donation_id

  validates :card_type, presence: true
  validates :serial, presence: true
  validates :pin, presence: true
  validates :declared_value, presence: true, numericality: { greater_than: 0 }
end
