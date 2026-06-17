require 'openssl'
require 'faraday'

class PayOsService
  BASE_URL = "https://api-merchant.payos.vn/v2/payment-requests"

  def self.client_id
    ENV['PAYOS_CLIENT_ID']
  end

  def self.api_key
    ENV['PAYOS_API_KEY']
  end

  def self.checksum_key
    ENV['PAYOS_CHECKSUM_KEY']
  end

  # Create PayOS payment link
  def self.create_payment_link(order_code:, amount:, description:, return_url:, cancel_url:, buyer_name:)
    # PayOS description is strictly limited to 25 chars, alphanumeric & spaces only, no accents!
    clean_desc = remove_vietnamese_accents(description)[0..24].gsub(/[^a-zA-Z0-9 ]/, '').strip

    data = {
      orderCode: order_code.to_i,
      amount: amount.to_i,
      description: clean_desc,
      cancelUrl: cancel_url,
      returnUrl: return_url,
      buyerName: buyer_name
    }

    # Generate signature
    # Signature is based on: amount, cancelUrl, description, orderCode, returnUrl (sorted alphabetically)
    sign_str = "amount=#{data[:amount]}&cancelUrl=#{data[:cancelUrl]}&description=#{data[:description]}&orderCode=#{data[:orderCode]}&returnUrl=#{data[:returnUrl]}"
    data[:signature] = generate_hmac(sign_str)

    # Make API request
    response = Faraday.post(BASE_URL) do |req|
      req.headers['x-client-id'] = client_id
      req.headers['x-api-key'] = api_key
      req.headers['Content-Type'] = 'application/json'
      req.body = data.to_json
    end

    result = JSON.parse(response.body)
    Rails.logger.info("PayOS Link Creation Response: #{result.inspect}")
    result
  rescue => e
    Rails.logger.error("PayOS Create Payment Link Error: #{e.message}")
    { "code" => "error", "desc" => e.message }
  end

  # Verify PayOS webhook data signature
  def self.verify_webhook(webhook_body)
    return false if webhook_body.nil? || webhook_body['signature'].nil?

    data_obj = webhook_body['data']
    received_signature = webhook_body['signature']

    # Sort data keys and construct query string
    sorted_keys = data_obj.keys.sort
    query_parts = sorted_keys.map do |key|
      val = data_obj[key]
      # Nested arrays/objects or boolean values are handled, but PayOS data fields are mostly strings/numbers
      "#{key}=#{val}"
    end
    raw_data_str = query_parts.join('&')

    calculated_signature = generate_hmac(raw_data_str)

    ActiveSupport::SecurityUtils.secure_compare(calculated_signature, received_signature)
  end

  private

  def self.generate_hmac(data_str)
    OpenSSL::HMAC.hexdigest('SHA256', checksum_key || '', data_str)
  end

  # Helper to remove accents from Vietnamese text
  def self.remove_vietnamese_accents(str)
    return "" if str.blank?
    accents = {
      'a' => /[àáảãạăằắẳẵặâầấẩẫậ]/,
      'A' => /[ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]/,
      'd' => /[đ]/,
      'D' => /[Đ]/,
      'e' => /[èéẻẽẹêềếểễệ]/,
      'E' => /[ÈÉẺẼẸÊỀẾỂỄỆ]/,
      'i' => /[ìíỉĩị]/,
      'I' => /[ÌÍỈĨỊ]/,
      'o' => /[òóỏõọôồốổỗộơờớởỡợ]/,
      'O' => /[ÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]/,
      'u' => /[ùúủũụưừứửữự]/,
      'U' => /[ÙÚỦŨỤƯỪỨỬỮỰ]/,
      'y' => /[ỳýỷỹỵ]/,
      'Y' => /[ỲÝỶỸỴ]/
    }
    result = str.dup
    accents.each do |replacement, regex|
      result.gsub!(regex, replacement)
    end
    result
  end
end
