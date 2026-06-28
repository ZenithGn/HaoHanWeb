class Api::SupportersController < ApplicationController
  # GET /api/supporters/donations
  def donations
    force = ActiveModel::Type::Boolean.new.cast(params[:refresh])
    payload = force ? DiscordDonationSupportersService.list(force: true) : DiscordDonationSupportersService.list_cached
    render json: payload, status: :ok
  end
end
