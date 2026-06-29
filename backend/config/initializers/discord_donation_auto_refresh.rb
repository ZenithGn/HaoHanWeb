Rails.application.config.after_initialize do
  next unless Rails.env.production?
  next if defined?(Rails::Console) || defined?(Rake)
  next if ARGV.any? { |arg| arg.to_s.include?('db:') }

  DiscordDonationSupportersService.start_auto_refresh!
end
