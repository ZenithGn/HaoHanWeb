class DiscordDonationSupportersService
  CACHE_TTL = 24.hours
  CACHE_PATH = Rails.root.join('tmp', 'discord_donation_supporters.json')
  DISCORD_API_BASE = 'https://discord.com/api/v10'
  MAX_MESSAGES_TO_SCAN = 500
  MANUAL_MESSAGES = [
    <<~TEXT,
      Trang 1
      @Pico | PicoXSVipMax - 3,550,000 VND ( TYSM )
      @Gờ không inn | Ginkei - 50,000 VND
      @miCa | mica_san - 150,000 VND
      @Cowsep | Cowsep2021 - 50,000 VND
      @Miophilk | Miophilkv3 - 40,000 VND
      @Eum ba pe | paindestroyleaf - 20,000 VND
      @Deleted User#0000 | Kuangg_VN - 60,000 VND
      @a  | Tuckii - 250,000 VND
      @Mizu#9504 | FishSeller - 30,000 VND
      @H | ILoveLinh - 170,000 VND
      @Hảo Thật Đấy(REHAB) | satmamama - 40,000 VND
      @Deleted User#0000 | NgMinhDuckAnh - 70,000 VND
      @hamjang#4710 | hamjang - 20,000 VND
      @imsosad | hoanghydro - 150,000 VND
      @mệt | D3MON_VN - 70,000 VND
      @kyon5668 | CS02 - 190,000 VND
      @unknown-user | JUnLI - 400,000 VND
      @vuphuongnam_#0 | Zz_South_zZ - 10,000 VND
      @᲼᲼᲼᲼᲼#3566 | dadadio - 100,000 VND
      @Deleted User#0000 | NotLynnZ - 30,000 VND
    TEXT
    <<~TEXT
      Trang 2
      @Chào Con Cặc Gì Mà Chào | HLinh_2k4 - 20,000 VND
      @\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ | 50,000 VND
      @shon | 10,000 VND
      @em cy cay | 10,000 VND
      @Ramon | 0Ramen - 100,000 VND
      @minerwoftkk | 50,000 VND
      @Deleted User#0000 | 70,000 VND
      @dan choi nam dinh™ | 50,000 VND + 2 ảnh gái alimi cho owner (60,000)
      @song#5482 | 20,000 VND
      @Thỏ | TanBoiNice - 50,000 VND
      @Ender_Dragon | Ender_Dragonn - 50,000 VND
      @Miophilk | Miophilk - 100,000 VND
      @Mai Linh#4429 | Mai_Linh - 50,000 VND
      @Bé Cá Bú Đá | Jh7xn - 20,000 VND
      @sicubidu - 0Clone | 100k card | 1/7/23
      @WAT - WAT | 100k
      @Duc | 10,000 VND
      @ohtanisvibrator | 50,000 VND
      @!  DuckAnh | 100,000 VND
    TEXT
  ].freeze

  class << self
    def list(force: false)
      cached = read_cache
      if !force && cache_fresh?(cached) && !(discord_configured? && cached['source'] == 'manual')
        return with_database_donations(cached).merge('cache' => 'hit')
      end

      with_database_donations(refresh)
    rescue => e
      Rails.logger.error("Discord donation supporters list error: #{e.class} - #{e.message}")
      with_database_donations(cached.presence || safe_manual_payload)
    end

    def refresh
      messages = discord_configured? ? fetch_discord_messages : MANUAL_MESSAGES
      payload = build_payload(messages, source: discord_configured? ? 'discord' : 'manual')
      write_cache(payload)
      payload
    rescue => e
      Rails.logger.error("Discord donation supporters refresh error: #{e.class} - #{e.message}")
      fallback = read_cache.presence || safe_manual_payload
      write_cache(fallback)
      fallback
    end

    def list_cached(refresh_async: true)
      cached = read_cache
      payload = cached.presence || safe_manual_payload

      if refresh_async && (!cache_fresh?(cached) || stale_supporter_cache?(cached))
        refresh_later
      end

      with_database_donations(payload).merge('cache' => cached.present? ? 'hit' : 'fallback')
    rescue => e
      Rails.logger.error("Discord donation supporters cached list error: #{e.class} - #{e.message}")
      with_database_donations(safe_manual_payload).merge('cache' => 'fallback')
    end

    def start_auto_refresh!
      return unless auto_refresh_enabled?
      return if @auto_refresh_started

      @auto_refresh_started = true
      Thread.new do
        loop do
          begin
            refresh
          rescue => e
            Rails.logger.error("Discord donation supporters scheduled refresh error: #{e.class} - #{e.message}")
          ensure
            ActiveRecord::Base.connection_pool.release_connection if defined?(ActiveRecord::Base)
          end

          sleep refresh_interval_seconds
        end
      end
    end

    def build_payload(messages, source:)
      pages = extract_pages(messages)
      supporters = merge_supporters(pages.flat_map { |page| page[:supporters] })

      {
        'supporters' => supporters,
        'pages' => pages.map { |page| { number: page[:number], count: page[:supporters].size } },
        'source' => source,
        'updated_at' => Time.current.iso8601
      }
    end

    private

    def discord_configured?
      bot_token.present? && channel_id.present?
    end

    def auto_refresh_enabled?
      ActiveModel::Type::Boolean.new.cast(ENV['DISCORD_DONATION_AUTO_REFRESH'])
    end

    def refresh_interval_seconds
      value = ENV['DISCORD_DONATION_REFRESH_INTERVAL_SECONDS'].to_i
      value.positive? ? value : CACHE_TTL.to_i
    end

    def channel_id
      ENV['DISCORD_DONATION_CHANNEL_ID'].presence || ENV['DISCORD_SUPPORTERS_CHANNEL_ID'].presence
    end

    def fetch_discord_messages
      messages = []
      before = nil
      user_profiles = {}

      while messages.size < MAX_MESSAGES_TO_SCAN
        response = Faraday.get("#{DISCORD_API_BASE}/channels/#{channel_id}/messages") do |req|
          req.headers['Authorization'] = "Bot #{bot_token}"
          req.params['limit'] = [100, MAX_MESSAGES_TO_SCAN - messages.size].min
          req.params['before'] = before if before.present?
          req.options.open_timeout = 5
          req.options.timeout = 12
        end

        raise "Discord API #{response.status}: #{response.body}" unless response.success?

        batch = JSON.parse(response.body)
        break if batch.empty?

        messages.concat(batch.map do |message|
          {
            'content' => message['content'].to_s,
            'mentions' => message['mentions'].to_a.map do |mention|
              profile = user_profiles[mention['id'].to_s] ||= fetch_discord_user_profile(mention['id'].to_s)
              {
                'id' => mention['id'].to_s,
                'name' => mention['global_name'].presence || mention['username'].presence || mention['id'].to_s,
                'avatar_url' => discord_avatar_url(profile.presence || mention),
                'banner_url' => discord_banner_url(profile),
                'accent_color' => profile&.dig('accent_color')
              }
            end
          }
        end)
        before = batch.last['id']
      end

      messages
    end

    def extract_pages(messages)
      pages = {}

      messages.each do |message|
        content = message.is_a?(Hash) ? message['content'].to_s : message.to_s
        mention_profiles = mention_profiles_for(message)
        current_page = nil

        content.each_line do |line|
          stripped = normalize_discord_line(line)
          next if stripped.blank?

          if (match = stripped.match(/\ATrang\s+(\d+)/i))
            current_page = match[1].to_i
            pages[current_page] ||= []
            next
          end

          next unless current_page

          supporter = parse_supporter_line(stripped, mention_profiles)
          pages[current_page] << supporter if supporter
        end
      end

      pages
        .sort_by { |page_number, _| page_number }
        .map { |page_number, supporters| { number: page_number, supporters: supporters } }
    end

    def parse_supporter_line(line, mention_profiles = {})
      amounts = extract_amounts(line)
      return nil if amounts.empty?

      first_amount_index = amounts.map { |amount| amount[:index] }.min
      name_part = line[0...first_amount_index].to_s
      name_part = name_part.gsub(/\A@/, '').gsub(/[-+|,\s]+\z/, '').strip
      return nil if name_part.blank?

      display_name, minecraft_name = split_names(name_part, mention_profiles)
      display_name = display_name.presence || minecraft_name.presence || 'Unknown supporter'
      avatar_url = avatar_url_from_name_part(name_part, mention_profiles)
      banner_url = banner_url_from_name_part(name_part, mention_profiles)
      accent_color = accent_color_from_name_part(name_part, mention_profiles)

      {
        display_name: display_name,
        username: minecraft_name.presence || display_name,
        minecraft_name: minecraft_name.presence,
        role: 'Donator',
        avatar_url: avatar_url,
        banner_url: banner_url,
        accent_color: accent_color,
        amount: amounts.sum { |amount| amount[:value] },
        entries: 1
      }
    end

    def normalize_discord_line(line)
      line.to_s
          .encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
          .strip
          .gsub(/\A```[a-z]*\s*/i, '')
          .gsub(/```\z/, '')
          .gsub(/\A>\s*/, '')
          .gsub(/\A\d+\.\s*/, '')
          .strip
    end

    def mention_profiles_for(message)
      return {} unless message.is_a?(Hash)

      message['mentions'].to_a.each_with_object({}) do |mention, profiles|
        profiles[mention['id'].to_s] = {
          name: mention['name'].to_s,
          avatar_url: mention['avatar_url'].presence,
          banner_url: mention['banner_url'].presence,
          accent_color: mention['accent_color']
        }
      end
    end

    def split_names(name_part, mention_profiles = {})
      if name_part.include?('|')
        parts = name_part.split('|').map(&:strip)
        [clean_name(parts.first, mention_profiles), clean_name(parts[1..].join(' | '), mention_profiles)]
      else
        [clean_name(name_part, mention_profiles), nil]
      end
    end

    def clean_name(value, mention_profiles = {})
      cleaned = value.to_s
                     .encode('UTF-8', invalid: :replace, undef: :replace, replace: '')
                     .gsub(/\A@/, '')
                     .gsub(/[-+,\s]+\z/, '')
                     .strip

      if (match = cleaned.match(/\A<@!?(\d+)>\z/))
        mention_profiles.dig(match[1], :name).presence || cleaned
      else
        cleaned
      end
    end

    def avatar_url_from_name_part(name_part, mention_profiles = {})
      mention_id = name_part.to_s.match(/<@!?(\d+)>/)&.[](1)
      mention_profiles.dig(mention_id, :avatar_url) if mention_id
    end

    def banner_url_from_name_part(name_part, mention_profiles = {})
      mention_id = name_part.to_s.match(/<@!?(\d+)>/)&.[](1)
      mention_profiles.dig(mention_id, :banner_url) if mention_id
    end

    def accent_color_from_name_part(name_part, mention_profiles = {})
      mention_id = name_part.to_s.match(/<@!?(\d+)>/)&.[](1)
      mention_profiles.dig(mention_id, :accent_color) if mention_id
    end

    def fetch_discord_user_profile(user_id)
      response = Faraday.get("#{DISCORD_API_BASE}/users/#{user_id}") do |req|
        req.headers['Authorization'] = "Bot #{bot_token}"
        req.options.open_timeout = 5
        req.options.timeout = 10
      end

      return nil unless response.success?

      JSON.parse(response.body)
    rescue => e
      Rails.logger.warn("Could not fetch Discord user profile #{user_id}: #{e.class} - #{e.message}")
      nil
    end

    def discord_avatar_url(mention)
      id = mention['id'].to_s
      avatar = mention['avatar'].to_s

      if avatar.present?
        extension = avatar.start_with?('a_') ? 'gif' : 'png'
        "https://cdn.discordapp.com/avatars/#{id}/#{avatar}.#{extension}?size=96"
      else
        default_index = (id.to_i >> 22) % 6
        "https://cdn.discordapp.com/embed/avatars/#{default_index}.png"
      end
    end

    def discord_banner_url(user)
      return nil unless user

      id = user['id'].to_s
      banner = user['banner'].to_s
      return nil if id.blank? || banner.blank?

      extension = banner.start_with?('a_') ? 'gif' : 'png'
      "https://cdn.discordapp.com/banners/#{id}/#{banner}.#{extension}?size=512"
    end

    def extract_amounts(line)
      amounts = []

      line.to_enum(:scan, /(\d[\d.,]*)\s*k\b/i).each do
        amounts << { value: amount_to_i(Regexp.last_match(1)) * 1000, index: Regexp.last_match.begin(0) }
      end

      line.to_enum(:scan, /(\d[\d.,]*)\s*(?:VND|VNĐ|đ)\b/i).each do
        amounts << { value: amount_to_i(Regexp.last_match(1)), index: Regexp.last_match.begin(0) }
      end

      line.to_enum(:scan, /\((\d[\d.,]*)\)/).each do
        amounts << { value: amount_to_i(Regexp.last_match(1)), index: Regexp.last_match.begin(0) }
      end

      amounts.uniq { |amount| [amount[:index], amount[:value]] }
    end

    def amount_to_i(raw)
      raw.to_s.gsub(/[^\d]/, '').to_i
    end

    def merge_supporters(supporters)
      merged = {}

      supporters.each do |supporter|
        key_source = generic_display_name?(supporter[:display_name]) ? supporter[:minecraft_name].presence : supporter[:display_name].presence
        key = (key_source || supporter[:minecraft_name] || supporter[:username]).to_s.downcase.gsub(/\s+/, ' ').strip

        if merged[key]
          merged[key][:amount] += supporter[:amount]
          merged[key][:entries] += supporter[:entries]
          merged[key][:display_name] = supporter[:display_name] if merged[key][:display_name].blank?
          merged[key][:minecraft_name] ||= supporter[:minecraft_name]
          merged[key][:username] = merged[key][:minecraft_name].presence || merged[key][:display_name]
          merged[key][:role] ||= 'Donator'
          merged[key][:avatar_url] ||= supporter[:avatar_url]
          merged[key][:banner_url] ||= supporter[:banner_url]
          merged[key][:accent_color] ||= supporter[:accent_color]
        else
          merged[key] = supporter.deep_dup
        end
      end

      merged.values
            .sort_by { |supporter| [-supporter[:amount], supporter[:display_name].downcase] }
            .map do |supporter|
              {
                display_name: supporter[:display_name],
                username: supporter[:username],
                minecraft_name: supporter[:minecraft_name],
                role: supporter[:role] || 'Donator',
                amount: supporter[:amount],
                entries: supporter[:entries],
                avatar_url: supporter[:avatar_url],
                banner_url: supporter[:banner_url],
                accent_color: supporter[:accent_color]
              }
            end
    end

    def generic_display_name?(display_name)
      display_name.to_s.match?(/\A(?:deleted user#0000|unknown supporter)\z/i)
    end

    def with_database_donations(payload)
      current_supporters = payload['supporters'].to_a.map { |supporter| supporter.deep_symbolize_keys }
      merged_supporters = merge_supporters(current_supporters + database_donation_supporters)

      payload.merge(
        'supporters' => merged_supporters,
        'source' => payload['source'].to_s.include?('database') ? payload['source'] : "#{payload['source']}+database"
      )
    rescue => e
      Rails.logger.warn("Could not merge database donation supporters: #{e.class} - #{e.message}")
      payload
    end

    def database_donation_supporters
      Donation.success.includes(:player).each_with_object({}) do |donation, grouped|
        player = donation.player
        next unless player

        key = player.username.to_s.downcase
        grouped[key] ||= {
          display_name: player.username,
          username: player.username,
          minecraft_name: player.username,
          role: 'Donator',
          avatar_url: player.avatar_url,
          banner_url: nil,
          accent_color: nil,
          amount: 0,
          entries: 0
        }

        grouped[key][:amount] += donation.amount.to_i
        grouped[key][:entries] += 1
      end.values
    rescue => e
      Rails.logger.warn("Could not load database donation supporters: #{e.class} - #{e.message}")
      []
    end

    def player_avatar_for(supporter)
      [supporter[:minecraft_name], supporter[:display_name], supporter[:username]]
        .compact
        .map { |name| name.to_s.strip }
        .reject(&:blank?)
        .each do |name|
          player = Player.where(username: name).first
          return player.avatar_url if player&.avatar_url.present?
        rescue => e
          Rails.logger.warn("Could not look up player avatar for #{name.inspect}: #{e.class} - #{e.message}")
        end

      nil
    end

    def read_cache
      return nil unless File.exist?(CACHE_PATH)

      JSON.parse(File.read(CACHE_PATH))
    rescue JSON::ParserError
      nil
    end

    def cache_fresh?(payload)
      return false unless payload && payload['updated_at']

      Time.zone.parse(payload['updated_at']) > CACHE_TTL.ago
    rescue ArgumentError, TypeError
      false
    end

    def stale_supporter_cache?(payload)
      return true if payload.blank?
      return true if discord_configured? && payload['source'] == 'manual'

      supporters = payload['supporters'].to_a
      supporters.any? && supporters.none? { |supporter| supporter['avatar_url'].present? || supporter[:avatar_url].present? }
    end

    def write_cache(payload)
      FileUtils.mkdir_p(CACHE_PATH.dirname)
      File.write(CACHE_PATH, JSON.pretty_generate(payload))
    rescue => e
      Rails.logger.warn("Could not write Discord donation supporters cache: #{e.class} - #{e.message}")
    end

    def refresh_later
      return if @refreshing

      @refreshing = true
      Thread.new do
        refresh
      rescue => e
        Rails.logger.error("Discord donation supporters async refresh error: #{e.class} - #{e.message}")
      ensure
        @refreshing = false
        ActiveRecord::Base.connection_pool.release_connection if defined?(ActiveRecord::Base)
      end
    end

    def safe_manual_payload
      build_payload(MANUAL_MESSAGES, source: 'manual')
    rescue => e
      Rails.logger.error("Discord donation supporters manual fallback error: #{e.class} - #{e.message}")
      {
        'supporters' => [],
        'pages' => [],
        'source' => 'manual',
        'updated_at' => Time.current.iso8601
      }
    end

    def bot_token
      ENV['DISCORD_BOT_TOKEN'].to_s.sub(/\ABot\s+/i, '').strip
    end
  end
end
