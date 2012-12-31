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

# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class PlaySensingAction < Madmass::Action::Action
    include Actions::PerceptionHelper


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      perc = Madmass::Perception::Percept.new(self)

      perc.add_headers({:topics => []}) #who must receive the percept
      game_percept = DataModel::Game.current ? DataModel::Game.current.to_percept : {}
      perc.data = {
        :sensing => game_percept.merge(
          :map => current_map,
          :infrastructures => current_infrastructures,
          :players_info => players_info,
          :market => current_market,
          :game_options => GameOptions.options(:base),
          :game_locales => GameLocales.get(['action', 'account', 'gui']),
          :settings => User.current.settings,
          :user_id => User.current.id,
          :user_state => User.current.state,
          :playing_users => users_in_states([:play, :end]),
          :players => [ DataModel::Player.current.to_percept ],
          :channel => DataModel::Game.current.channel,
          :event => 'manage-state'
        )
      }

      Madmass.current_perception << perc
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      unless DataModel::Game.current
        why_not_applicable.publish(
          :name => :game_not_exist, 
          :key => 'action.game.not_exists',
          :recipients => []
        )
      end
      return why_not_applicable.empty?
    end

  end

end