class RolesChannel < ApplicationCable::Channel
  def subscribed
    if current_user
      stream_from "roles_channel_#{current_user.id}"
    else
      reject
    end
  end

  def unsubscribed
  end
end
