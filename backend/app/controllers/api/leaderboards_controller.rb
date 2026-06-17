class Api::LeaderboardsController < ApplicationController
  # GET /api/leaderboards
  def index
    # Top 10 Donors
    top_donors = Player.where('total_donated > 0')
                       .order(total_donated: :desc)
                       .limit(10)
                       .map do |p|
                         {
                           username: p.username,
                           uuid: p.uuid,
                           total_donated: p.total_donated,
                           role: p.role,
                           avatar_url: p.avatar_url || "https://playerdb.co/avatar/player/#{p.username}"
                         }
                       end

    # Top 10 Playtime
    top_playtime = Player.where('play_time > 0')
                         .order(play_time: :desc)
                         .limit(10)
                         .map do |p|
                           {
                             username: p.username,
                             uuid: p.uuid,
                             play_time: p.play_time,
                             role: p.role,
                             avatar_url: p.avatar_url || "https://playerdb.co/avatar/player/#{p.username}"
                           }
                         end

    render json: {
      top_donors: top_donors,
      top_playtime: top_playtime
    }, status: :ok
  end
end
