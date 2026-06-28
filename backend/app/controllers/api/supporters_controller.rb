class Api::SupportersController < ApplicationController
  # GET /api/supporters/donations
  def donations
    force = ActiveModel::Type::Boolean.new.cast(params[:refresh])
    render json: DiscordDonationSupportersService.list(force: force), status: :ok
  end
end
