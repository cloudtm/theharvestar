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
module Actions
  class UnjoinGameAction < Madmass::Action::Action
    action_states :join
    next_state :list


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # FIXME: change this
      # increment game and players version
      DataModel::Game.current.increase_version if DataModel::Game.current
      @game_zombie = User.leave
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      # first perception to sender only
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ 'list' ]})
      p.data = {
        :user_id => User.current.id,
        :user_state => User.current.state,
        # TODO: check if channel is in use in the client
        :channel => 'list',
        :event => 'unjoin-game'
      }
      p.data.merge!(@game_zombie) if @game_zombie
      Madmass.current_perception << p
    end

  end

end
