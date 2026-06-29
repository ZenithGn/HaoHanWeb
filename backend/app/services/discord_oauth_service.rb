class DiscordOauthService
  CLIENT_ID = ENV['DISCORD_CLIENT_ID']
  CLIENT_SECRET = ENV['DISCORD_CLIENT_SECRET']
  REDIRECT_URI = ENV['DISCORD_REDIRECT_URI']
  BOT_TOKEN = ENV['DISCORD_BOT_TOKEN']
  GUILD_ID = ENV['DISCORD_GUILD_ID']

  DISCORD_ROLE_HIERARCHY = [
    "Owner",
    "Administrator",
    "Cán Bộ",
    "Hảo Hán Bot",
    "Helper",
    "HaoHan Support",
    "Donator",
    "Animator",
    "Booster",
    "Dev",
    "Youtuber",
    "Emoji Man",
    "Members"
  ].freeze

  # Generate Discord OAuth authorize URL
  def self.authorize_url(state = nil)
    params = {
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "identify"
    }
    params[:state] = state if state.present?
    "https://discord.com/api/oauth2/authorize?#{params.to_query}"
  end

  # Exchange authorization code for token
  def self.exchange_code(code)
    response = Faraday.post("https://discord.com/api/v10/oauth2/token") do |req|
      req.headers['Content-Type'] = 'application/x-www-form-urlencoded'
      req.body = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }.to_query
    end

    if response.success?
      JSON.parse(response.body)
    else
      raise "Lỗi xác thực Discord: #{response.body}"
    end
  end

  # Fetch user profile info
  def self.fetch_user_profile(access_token)
    response = Faraday.get("https://discord.com/api/v10/users/@me") do |req|
      req.headers['Authorization'] = "Bearer #{access_token}"
    end

    if response.success?
      JSON.parse(response.body)
    else
      raise "Lỗi lấy thông tin người dùng Discord: #{response.body}"
    end
  end

  # Check if user is in guild and return their roles
  # Returns array of role names
  def self.fetch_guild_member_roles(discord_user_id)
    token = bot_token
    if token.blank? || GUILD_ID.blank?
      Rails.logger.warn("Discord BOT_TOKEN or GUILD_ID is not configured. Skipping guild check and returning default Member role.")
      return ["Members"]
    end

    # 1. Fetch guild roles to resolve IDs to Names
    roles_resp = Faraday.get("https://discord.com/api/v10/guilds/#{GUILD_ID}/roles") do |req|
      req.headers['Authorization'] = "Bot #{token}"
      req.options.open_timeout = 5
      req.options.timeout = 10
    end

    unless roles_resp.success?
      Rails.logger.error("Failed to fetch Discord guild roles: #{roles_resp.body}")
      return ["Members"]
    end

    guild_roles = JSON.parse(roles_resp.body)
    role_map = guild_roles.each_with_object({}) { |r, h| h[r['id']] = r['name'] }

    # 2. Fetch guild member
    member_resp = Faraday.get("https://discord.com/api/v10/guilds/#{GUILD_ID}/members/#{discord_user_id}") do |req|
      req.headers['Authorization'] = "Bot #{token}"
      req.options.open_timeout = 5
      req.options.timeout = 10
    end

    if member_resp.status == 404
      # 10007 code is Unknown Member
      raise "NOT_IN_SERVER"
    elsif !member_resp.success?
      Rails.logger.error("Failed to fetch Discord member details: #{member_resp.body}")
      raise "Lỗi kiểm tra thành viên server Discord: #{member_resp.body}"
    end

    member_data = JSON.parse(member_resp.body)
    member_role_ids = member_data['roles'] || []

    # Map member role IDs to Names
    member_role_ids.map { |id| role_map[id] }.compact
  end

  # Map roles to the highest role in hierarchy
  def self.determine_highest_role(role_names)
    DISCORD_ROLE_HIERARCHY.each do |role_name|
      if role_names.any? { |r| r.casecmp?(role_name) }
        return role_name
      end
    end
    "default"
  end

  def self.bot_token
    ENV['DISCORD_BOT_TOKEN'].to_s.sub(/\ABot\s+/i, '').strip
  end
end
