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

# This action joins the user to a game.
#
# === Accepted parameters
# * game_id: game id to join, or...
# * game_name: ... game name to join.
#
# This allows you to specify the game to join by id or by name.
#
# === Applicability
# * The game to join must exist.
# * The game must not be full.
# * The user can not join the same game he is already playing.
# * The user can play only one game at the time.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
# * All players
#
module Actions
  class JoinSensingAction < Madmass::Action::Action
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
          :game_options => GameOptions.options(:base),
          :game_locales => GameLocales.get(['action', 'account', 'gui']),
          #:settings => %q( {"audio":{"volume":{"fx":100,"music":0}},"hiscores":{"size":10},"gui":{"presence":{"open":true,"entries":20}}} ),
          :playing_users => User.where(:state => [:play, :end]).map(&:id),
          :user_id => User.current.id,
          :user_state => User.current.state,
          :users => user_data,
          :channel => 'list',
          :games_list => DataModel::Game.games_list(:states => ['joining', 'armed'], :text => @parameters[:text]),
          :settings => User.current.settings
        )
      }

      Madmass.current_perception << perc
    end

  end
end
