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

# This action creates a new game.
#
# === Accepted parameters
# * *format*: Game format
# * *name*: Game name
#
# === Applicability
# * The user who wants to create the game must not be already playing another game.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
#
module Actions
  class CreateGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_params :name, :format, :terrains
    action_states :list
    next_state :join

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      DataModel::Game.factory @parameters
      User.join DataModel::Game.current.id
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => ['list']}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'join-game'
      )
      Madmass.current_perception << p
    end

  end

end
