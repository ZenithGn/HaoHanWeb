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
        return cached.merge('cache' => 'hit')
      end

      refresh
    rescue => e
      Rails.logger.error("Discord donation supporters list error: #{e.class} - #{e.message}")
      cached.presence || build_payload(MANUAL_MESSAGES, source: 'manual')
    end

    def refresh
      messages = discord_configured? ? fetch_discord_messages : MANUAL_MESSAGES
      payload = build_payload(messages, source: discord_configured? ? 'discord' : 'manual')
      write_cache(payload)
      payload
    rescue => e
      Rails.logger.error("Discord donation supporters refresh error: #{e.class} - #{e.message}")
      fallback = build_payload(MANUAL_MESSAGES, source: 'manual')
      write_cache(fallback)
      fallback
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
      ENV['DISCORD_BOT_TOKEN'].present? && channel_id.present?
    end

    def channel_id
      ENV['DISCORD_DONATION_CHANNEL_ID'].presence || ENV['DISCORD_SUPPORTERS_CHANNEL_ID'].presence
    end

    def fetch_discord_messages
      messages = []
      before = nil

      while messages.size < MAX_MESSAGES_TO_SCAN
        response = Faraday.get("#{DISCORD_API_BASE}/channels/#{channel_id}/messages") do |req|
          req.headers['Authorization'] = "Bot #{ENV.fetch('DISCORD_BOT_TOKEN')}"
          req.params['limit'] = [100, MAX_MESSAGES_TO_SCAN - messages.size].min
          req.params['before'] = before if before.present?
        end

        raise "Discord API #{response.status}: #{response.body}" unless response.success?

        batch = JSON.parse(response.body)
        break if batch.empty?

        messages.concat(batch.map do |message|
          {
            'content' => message['content'].to_s,
            'mentions' => message['mentions'].to_a.map do |mention|
              {
                'id' => mention['id'].to_s,
                'name' => mention['global_name'].presence || mention['username'].presence || mention['id'].to_s
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
        mention_names = mention_names_for(message)
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

          supporter = parse_supporter_line(stripped, mention_names)
          pages[current_page] << supporter if supporter
        end
      end

      pages
        .sort_by { |page_number, _| page_number }
        .map { |page_number, supporters| { number: page_number, supporters: supporters } }
    end

    def parse_supporter_line(line, mention_names = {})
      amounts = extract_amounts(line)
      return nil if amounts.empty?

      first_amount_index = amounts.map { |amount| amount[:index] }.min
      name_part = line[0...first_amount_index].to_s
      name_part = name_part.gsub(/\A@/, '').gsub(/[-+|,\s]+\z/, '').strip
      return nil if name_part.blank?

      display_name, minecraft_name = split_names(name_part, mention_names)
      display_name = display_name.presence || minecraft_name.presence || 'Unknown supporter'

      {
        display_name: display_name,
        username: minecraft_name.presence || display_name,
        minecraft_name: minecraft_name.presence,
        role: 'Donator',
        amount: amounts.sum { |amount| amount[:value] },
        entries: 1
      }
    end

    def normalize_discord_line(line)
      line.to_s
          .strip
          .gsub(/\A```[a-z]*\s*/i, '')
          .gsub(/```\z/, '')
          .gsub(/\A>\s*/, '')
          .gsub(/\A\d+\.\s*/, '')
          .strip
    end

    def mention_names_for(message)
      return {} unless message.is_a?(Hash)

      message['mentions'].to_a.each_with_object({}) do |mention, names|
        names[mention['id'].to_s] = mention['name'].to_s
      end
    end

    def split_names(name_part, mention_names = {})
      if name_part.include?('|')
        parts = name_part.split('|').map(&:strip)
        [clean_name(parts.first, mention_names), clean_name(parts[1..].join(' | '), mention_names)]
      else
        [clean_name(name_part, mention_names), nil]
      end
    end

    def clean_name(value, mention_names = {})
      cleaned = value.to_s.gsub(/\A@/, '').gsub(/[-+,\s]+\z/, '').strip

      if (match = cleaned.match(/\A<@!?(\d+)>\z/))
        mention_names[match[1]].presence || cleaned
      else
        cleaned
      end
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
                entries: supporter[:entries]
              }
            end
    end

    def generic_display_name?(display_name)
      display_name.to_s.match?(/\A(?:deleted user#0000|unknown supporter)\z/i)
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

    def write_cache(payload)
      FileUtils.mkdir_p(CACHE_PATH.dirname)
      File.write(CACHE_PATH, JSON.pretty_generate(payload))
    end
  end
end
