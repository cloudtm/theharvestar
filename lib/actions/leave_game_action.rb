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

# This action allows an user to leave the game.
#
# === Accepted parameters
# Nothing.
#
# === Applicability
# * The user must be playing a game.
#
# === Trace
# Nothing.
#
# === Perception
# * Empty ({})
#
module Actions
  class LeaveGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_states :end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      @leaved = {:channel => DataModel::Game.current.channel, :pid => DataModel::Player.current.id}
      User.leave
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:clients => [ User.current.id ]}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'manage-state',
        :games_list => DataModel::Game.games_list(:states => ['joining', 'armed'])
      )
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ @leaved.channel ]}) #who must receive the percept
      p.data =  {
        :event => 'summary-leaved',
        :pid => @leaved[:pid]
      }
      Madmass.current_perception << p
    end

  end

end
