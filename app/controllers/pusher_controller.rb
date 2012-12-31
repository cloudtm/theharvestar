###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# TheHarvestar is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# TheHarvestar is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with TheHarvestar.  If not, see <http://www.gnu.org/licenses/>.
#
# Copyright (c) 2010-2013 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Largo Alfredo Oriani 12
# 00152 Rome, Italy
#
###############################################################################
###############################################################################

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