class PendingDonationCleanupService
  DEFAULT_MAX_AGE = 2.days
  DEFAULT_INTERVAL = 24.hours

  class << self
    def cleanup!(max_age: DEFAULT_MAX_AGE)
      cutoff = Time.current - max_age
      scope = Donation.pending.where('created_at < ?', cutoff)
      count = scope.count
      scope.delete_all

      Rails.logger.info("Pending donation cleanup removed #{count} records older than #{cutoff.iso8601}")
      count
    rescue => e
      Rails.logger.error("Pending donation cleanup failed: #{e.class} - #{e.message}")
      0
    end

    def start_auto_cleanup!
      return if @auto_cleanup_started

      @auto_cleanup_started = true
      Thread.new do
        Thread.current.name = 'pending-donation-cleanup' if Thread.current.respond_to?(:name=)

        loop do
          begin
            cleanup!
          ensure
            ActiveRecord::Base.connection_pool.release_connection if defined?(ActiveRecord::Base)
            sleep DEFAULT_INTERVAL.to_i
          end
        end
      end
    end
  end
end
