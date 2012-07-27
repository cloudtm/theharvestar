# Using https://github.com/pusher/pusher-gem
class PusherController < ApplicationController
  protect_from_forgery :except => :auth # stop rails CSRF protection for this action

  # Pusher auth for private channels only, not presence
  #def auth
  #  if current_user
  #    response = Pusher[params[:channel_name]].authenticate(params[:socket_id])
  #    render :json => response
  #  else
  #    render :text => "Not authorized", :status => '403'
  #  end
  #end

  # Pusher auth for private and presence channels
  def auth
    if current_user
      response = Pusher[params[:channel_name]].authenticate(params[:socket_id], {
        :user_id => current_user.id, # => required
        :user_info => {# => optional - for example
          :nickname => 'Marko', #current_user.nickname,
          :image => '/assets/anonymous.png', #current_user.picture.url(:small),
          :state => 'list', #current_user.state,
          :at => Time.now
        }
      })
      render :json => response
    else
      render :text => "Not authorized", :status => '403'
    end
  end

end