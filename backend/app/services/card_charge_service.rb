class CardChargeService
  GATEWAY_URL = ENV.fetch('CARD_GATEWAY_URL') { 'https://mock-card-gateway.com/api' }
  PARTNER_ID = ENV['CARD_PARTNER_ID']
  PARTNER_KEY = ENV['CARD_PARTNER_KEY']

  # Submit scratch card details
  def self.submit_card(card_type:, serial:, pin:, declared_value:, request_id:)
    # If no partner details configured, run in Mock/Sandbox mode automatically!
    if PARTNER_ID.blank? || PARTNER_KEY.blank?
      Rails.logger.info("[Mock Card Gateway] Card submitted successfully: Type: #{card_type}, Serial: #{serial}, Value: #{declared_value}, RequestId: #{request_id}")
      return { status: 'PENDING', message: 'Gửi thẻ thành công (Mock Sandbox Mode)', tx_ref: request_id }
    end

    # Real implementation for typical Vietnamese card gateways (e.g. CardVIP, TheSieuRe)
    # Sign format: md5(partner_key + pin + serial) or similar depending on gateway
    sign = Digest::MD5.hexdigest(PARTNER_KEY + pin + serial)

    payload = {
      telco: card_type.upcase,
      code: pin,
      serial: serial,
      amount: declared_value.to_i,
      request_id: request_id,
      partner_id: PARTNER_ID,
      sign: sign,
      command: 'charging'
    }

    begin
      response = Faraday.post(GATEWAY_URL, payload.to_json, { 'Content-Type' => 'application/json' })
      result = JSON.parse(response.body)
      
      # Map standard response statuses
      # Typically: 99 = Pending, 1 = Success, 2 = Failed, 3 = Wrong Value
      if result['status'] == 99 || result['status'] == '99'
        { status: 'PENDING', message: 'Thẻ đang được xử lý', tx_ref: request_id }
      elsif result['status'] == 1 || result['status'] == '1'
        { status: 'SUCCESS', message: 'Thẻ đúng', tx_ref: request_id }
      else
        { status: 'FAILED', message: result['message'] || 'Thẻ lỗi hoặc sai thông tin', tx_ref: request_id }
      end
    rescue => e
      Rails.logger.error("Card charging gateway error: #{e.message}")
      { status: 'ERROR', message: "Lỗi kết nối cổng gạch thẻ: #{e.message}" }
    end
  end

  # Verify card gateway callback signatures
  def self.verify_callback(params)
    return true if PARTNER_ID.blank? || PARTNER_KEY.blank? # Auto-pass in mock mode

    # Standard gateway verification checks: MD5 of key + code + serial + status + etc
    received_sign = params['sign']
    # Typically: md5(partner_key + code + serial) or similar
    calculated_sign = Digest::MD5.hexdigest(PARTNER_KEY + params['code'].to_s + params['serial'].to_s)
    
    ActiveSupport::SecurityUtils.secure_compare(calculated_sign, received_sign)
  end
end
