class ServerStatusLog < ApplicationRecord
  self.table_name = 'server_status_logs'

  validates :online_players, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :max_players, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :tps, presence: true, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 20 }
end
