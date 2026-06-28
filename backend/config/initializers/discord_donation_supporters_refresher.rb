if ENV['DISCORD_DONATION_AUTO_REFRESH'].to_s.downcase == 'true'
  Rails.application.config.after_initialize do
    next if defined?(Rails::Console)
    next if defined?(Rake) && Rake.application.top_level_tasks.any?

    Thread.new do
      Thread.current.name = 'discord-donation-supporters-refresher' if Thread.current.respond_to?(:name=)

      loop do
        begin
          payload = DiscordDonationSupportersService.refresh
          Rails.logger.info(
            "Discord donation supporters refreshed: #{payload['supporters'].size} supporters from #{payload['source']}"
          )
        rescue => e
          Rails.logger.error("Discord donation supporters auto refresh failed: #{e.class} - #{e.message}")
        ensure
          sleep ENV.fetch('DISCORD_DONATION_REFRESH_INTERVAL_SECONDS', 24.hours.to_i).to_i
        end
      end
    end
  end
end
