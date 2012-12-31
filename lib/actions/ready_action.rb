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

# This action toggles the ready state for the user when joined to a game.
#
# === Accepted parameters
# Nothing.
#
# === Applicability
# * The user must be joined to a game.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
# * Current player
module Actions
  class ReadyAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params
    action_states :join

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      toggled_ready = !DataModel::Player.ready?
      DataModel::Player.ready(toggled_ready)

      #trace :current, :game
      #trace :players, Game.current.fresh_players  #TODO:check if this is needed (we have already the model validation on uniqness of slot)

    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [DataModel::Game.current.channel]}) #who must receive the percept

      p.data = DataModel::Game.current.to_percept.merge(
        # upadtes the state as it certainly changes on transitions
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'user-ready'
      )
      Madmass.current_perception << p
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      true
    end

  end

end
