class Api::DonationsController < ApplicationController
  before_action :authenticate_user!, only: [:payos_create, :card_submit]
  skip_before_action :verify_authenticity_token, raise: false # For API mode

  # POST /api/donate (Legacy mock endpoint, redirecting or processing mock)
  def create
    name = params[:name] || "Unknown Player"
    render json: {
      success: true,
      name: name,
      message: "Cổng thanh toán thử nghiệm. Cảm ơn #{name} đã ủng hộ!"
    }, status: :ok
  end

  # POST /api/donations/payos/create
  def payos_create
    amount = params[:amount].to_i
    message = params[:message]&.strip

    if amount < 1000
      return render json: { error: 'Số tiền quyên góp tối thiểu là 1.000 đ!' }, status: :bad_request
    end

    # PayOS requires a unique orderCode that fits in standard integer
    order_code = Time.now.to_i + rand(100..999) # Combines timestamp + 3 digit randomizer

    # Target URLs
    host = request.base_url
    return_url = "#{host}/donate?status=success&orderCode=#{order_code}"
    cancel_url = "#{host}/donate?status=cancel&orderCode=#{order_code}"

    # Call PayOS Service
    res = PayOsService.create_payment_link(
      order_code: order_code,
      amount: amount,
      description: "Nap game #{current_user.username}",
      return_url: return_url,
      cancel_url: cancel_url,
      buyer_name: current_user.username
    )

    if res['code'] == '00' || res['code'] == 0
      # Create pending donation in database
      donation = Donation.create!(
        player_id: current_user.id,
        method: 'PAYOS',
        amount: amount,
        tx_ref: order_code.to_s,
        status: 'PENDING',
        message: message
      )

      render json: {
        message: 'Tạo liên kết thanh toán thành công!',
        checkoutUrl: res['data']['checkoutUrl'],
        qrCode: res['data']['qrCode'],
        orderCode: order_code,
        amount: amount
      }, status: :ok
    else
      render json: { error: "Không thể khởi tạo thanh toán với PayOS: #{res['desc']}" }, status: :unprocessable_entity
    end
  end

  # POST /api/donations/payos/webhook
  def payos_webhook
    webhook_body = params.as_json

    # 1. Verify webhook signature
    unless PayOsService.verify_webhook(webhook_body)
      return render json: { error: 'Invalid Webhook Signature' }, status: :unauthorized
    end

    data = webhook_body['data']
    order_code = data['orderCode'].to_s
    amount = data['amount']
    success = webhook_body['success'] || webhook_body['code'] == '00' || webhook_body['code'] == 0

    donation = Donation.find_by(tx_ref: order_code)

    if donation && donation.status == 'PENDING'
      if success
        ActiveRecord::Base.transaction do
          # Update donation status
          donation.update!(status: 'SUCCESS', amount: amount)
          
          # Update player balance
          player = donation.player
          new_total = player.total_donated.to_f + amount.to_f
          player.update!(total_donated: new_total)

          # Trigger RCON Service
          # Promotes role to VIP (LuckPerms) and sends broadcast message in game
          RconService.execute("lp user #{player.username} parent add vip") rescue nil
          RconService.execute("say #{player.username} da donate thanh cong #{amount} VND! Cam on ban!") rescue nil

          # Trigger Discord notification
          DiscordService.notify_donation(donation) rescue nil
        end
        Rails.logger.info("PayOS Webhook SUCCESS: Updated Donation #{order_code}")
      else
        donation.update!(status: 'FAILED')
        Rails.logger.info("PayOS Webhook FAILED: Updated Donation #{order_code}")
      end
    end

    render json: { success: true }, status: :ok
  end

  # POST /api/donations/card/submit
  def card_submit
    card_type = params[:card_type]&.strip&.upcase
    serial = params[:serial]&.strip
    pin = params[:pin]&.strip
    declared_value = params[:declared_value].to_i
    message = params[:message]&.strip

    if card_type.blank? || serial.blank? || pin.blank? || declared_value <= 0
      return render json: { error: 'Vui lòng cung cấp đầy đủ thông tin thẻ cào!' }, status: :bad_request
    end

    # Generate unique transaction reference for card gateway callback tracking
    tx_ref = "CD_#{SecureRandom.hex(8)}"

    ActiveRecord::Base.transaction do
      # Create pending donation
      donation = Donation.create!(
        player_id: current_user.id,
        method: 'CARD',
        amount: declared_value,
        tx_ref: tx_ref,
        status: 'PENDING',
        message: message
      )

      # Create card details mapping
      CardDetail.create!(
        donation_id: donation.id,
        card_type: card_type,
        serial: serial,
        pin: pin,
        declared_value: declared_value
      )

      # Call Card gateway submission
      res = CardChargeService.submit_card(
        card_type: card_type,
        serial: serial,
        pin: pin,
        declared_value: declared_value,
        request_id: tx_ref
      )

      if res[:status] == 'PENDING' || res[:status] == 'SUCCESS'
        if res[:status] == 'SUCCESS'
          # If gateway processed it synchronously as success (unlikely, but possible)
          donation.update!(status: 'SUCCESS')
          current_user.update!(total_donated: current_user.total_donated.to_f + declared_value.to_f)
          RconService.execute("lp user #{current_user.username} parent add vip") rescue nil
          RconService.execute("say #{current_user.username} da nap card thanh cong #{declared_value} VND!") rescue nil
          DiscordService.notify_donation(donation) rescue nil
        end
        
        render json: {
          message: 'Thẻ cào đã được gửi lên hệ thống và đang chờ duyệt!',
          tx_ref: tx_ref,
          status: 'PENDING'
        }, status: :ok
      else
        # Submission failed
        donation.update!(status: 'FAILED')
        render json: { error: "Gửi thẻ thất bại: #{res[:message]}" }, status: :unprocessable_entity
      end
    end
  rescue => e
    render json: { error: "Lỗi trong quá trình xử lý thẻ: #{e.message}" }, status: :unprocessable_entity
  end

  # POST /api/donations/card/callback (Called by scratch card gateway provider)
  def card_callback
    # Verify signature from gateway
    unless CardChargeService.verify_callback(params.as_json)
      return render json: { error: 'Invalid Signature' }, status: :unauthorized
    end

    # Extract gateway status fields (standard mappings: status = 1 (success), status = 2 (failed))
    tx_ref = params[:request_id]
    status = params[:status].to_i
    actual_value = params[:value].to_i # Actual value received (could differ if user declared wrong value)

    donation = Donation.find_by(tx_ref: tx_ref)

    if donation && donation.status == 'PENDING'
      if status == 1
        ActiveRecord::Base.transaction do
          # Update amount if actual value is different
          final_amount = actual_value > 0 ? actual_value : donation.amount
          donation.update!(status: 'SUCCESS', amount: final_amount)

          player = donation.player
          new_total = player.total_donated.to_f + final_amount.to_f
          player.update!(total_donated: new_total)

          # Trigger game promotions
          RconService.execute("lp user #{player.username} parent add vip") rescue nil
          RconService.execute("say #{player.username} da nap card thanh cong #{final_amount} VND! Cam on ban!") rescue nil

          # Trigger Discord notification
          DiscordService.notify_donation(donation) rescue nil
        end
        Rails.logger.info("Card Callback SUCCESS: Updated Donation #{tx_ref} with amount #{actual_value}")
      else
        donation.update!(status: 'FAILED')
        Rails.logger.info("Card Callback FAILED: Updated Donation #{tx_ref}")
      end
    end

    render json: { message: 'Callback received successfully' }, status: :ok
  end

  # POST /api/test/payos-signature (Development helper to generate signed webhook payload for Postman testing)
  def payos_signature
    unless Rails.env.development?
      return render json: { error: 'Only available in development environment' }, status: :forbidden
    end

    order_code = params[:orderCode].to_i
    amount = params[:amount].to_i
    description = params[:description] || "Nap game test"

    data = {
      orderCode: order_code,
      amount: amount,
      description: description,
      accountNumber: "123456789",
      reference: "test_ref",
      transactionDateTime: Time.now.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Sort keys alphabetically and construct payload sign string
    sorted_keys = data.keys.sort
    query_parts = sorted_keys.map { |k| "#{k}=#{data[k]}" }
    raw_data_str = query_parts.join('&')

    checksum_key = ENV['PAYOS_CHECKSUM_KEY'] || 'your_payos_checksum_key'
    signature = OpenSSL::HMAC.hexdigest('SHA256', checksum_key, raw_data_str)

    render json: {
      success: true,
      code: "00",
      data: data,
      signature: signature
    }, status: :ok
  end

  # POST /api/test/card-signature (Development helper to generate signed card callback payload for Postman testing)
  def card_signature
    unless Rails.env.development?
      return render json: { error: 'Only available in development environment' }, status: :forbidden
    end

    request_id = params[:request_id]
    status = params[:status] || 1
    value = params[:value] || 10000
    code = params[:code] || "123456"
    serial = params[:serial] || "987654"

    partner_key = ENV['CARD_PARTNER_KEY'] || ''
    sign = Digest::MD5.hexdigest(partner_key + code.to_s + serial.to_s)

    render json: {
      request_id: request_id,
      status: status,
      value: value,
      code: code,
      serial: serial,
      sign: sign
    }, status: :ok
  end
end
