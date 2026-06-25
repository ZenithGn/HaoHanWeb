class CloudinaryService
  def self.upload_image(image_url)
    cloud_name = ENV['CLOUDINARY_CLOUD_NAME']
    api_key = ENV['CLOUDINARY_API_KEY']
    api_secret = ENV['CLOUDINARY_API_SECRET']

    if cloud_name.blank? || api_key.blank? || api_secret.blank?
      Rails.logger.warn("Cloudinary configuration missing. Bypassing upload, using original URL.")
      return image_url
    end

    timestamp = Time.now.to_i.to_s
    params = {
      folder: "haohan_avatars",
      timestamp: timestamp
    }

    # Sort parameters alphabetically, join with & and append secret key
    signature_string = params.sort.map { |k, v| "#{k}=#{v}" }.join("&") + api_secret
    signature = Digest::SHA1.hexdigest(signature_string)

    response = Faraday.post("https://api.cloudinary.com/v1_1/#{cloud_name}/image/upload") do |req|
      req.body = {
        file: image_url,
        api_key: api_key,
        timestamp: timestamp,
        folder: "haohan_avatars",
        signature: signature
      }
    end

    if response.success?
      res_data = JSON.parse(response.body)
      res_data['secure_url'] || res_data['url']
    else
      Rails.logger.error("Cloudinary upload failed: #{response.body}")
      image_url
    end
  rescue => e
    Rails.logger.error("Cloudinary service error: #{e.message}")
    image_url
  end
end
