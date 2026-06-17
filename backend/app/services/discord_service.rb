class DiscordService
  WEBHOOK_URL = ENV['DISCORD_WEBHOOK_URL']

  def self.notify_new_user(player)
    return if WEBHOOK_URL.blank?

    payload = {
      embeds: [
        {
          title: "🎉 Thành viên mới đăng ký!",
          description: "Chào mừng **#{player.username}** đã đăng ký tài khoản thành công trên hệ thống Web Portal.",
          color: 3447003, # Blue
          fields: [
            { name: "Tên nhân vật", value: player.username, inline: true },
            { name: "UUID", value: player.uuid || "Chưa liên kết", inline: true }
          ],
          timestamp: Time.current.iso8601
        }
      ]
    }

    send_webhook(payload)
  end

  def self.notify_donation(donation)
    return if WEBHOOK_URL.blank?

    player = donation.player
    payload = {
      embeds: [
        {
          title: "💖 Có người quyên góp mới!",
          description: "Cảm ơn **#{player.username}** đã ủng hộ máy chủ!",
          color: 3066993, # Green
          fields: [
            { name: "Người nạp", value: player.username, inline: true },
            { name: "Số tiền", value: "#{ActiveSupport::NumberHelper.number_to_currency(donation.amount, unit: 'VND', precision: 0, delimiter: '.')} đ", inline: true },
            { name: "Hình thức", value: donation.method, inline: true },
            { name: "Nội dung", value: donation.message.presence || "Không có", inline: false }
          ],
          timestamp: Time.current.iso8601
        }
      ]
    }

    send_webhook(payload)
  end

  private

  def self.send_webhook(payload)
    Faraday.post(WEBHOOK_URL) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.body = payload.to_json
    end
  rescue => e
    Rails.logger.error("Discord Webhook Error: #{e.message}")
  end
end
