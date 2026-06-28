namespace :discord_donations do
  desc 'Refresh cached Discord donation supporters once'
  task refresh: :environment do
    payload = DiscordDonationSupportersService.refresh
    puts "Donation supporters refreshed: #{payload['supporters'].size} supporters from #{payload['source']} at #{payload['updated_at']}"
  end

  desc 'Refresh cached Discord donation supporters every 24 hours'
  task watch: :environment do
    loop do
      Rake::Task['discord_donations:refresh'].reenable
      Rake::Task['discord_donations:refresh'].invoke
      sleep 24.hours
    end
  end
end
