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

# This action ends the game and returns the scores to all players.
#
# === Accepted parameters
# * nothing
#
# === Applicability
# * The game has a winner.
#
# === Trace
# * Current game
#
# === Perception
# * Game (with scores)
# * All player
#
module Actions
  class EndGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_states :play

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # This action changes the user state only for current user! We need to change
      # the state also for the other joined users so we do it here hacking in the user model.
      # Brain storm it differently in madmass :)
      DataModel::Game.current.players.each do |player|
        #unless player == DataModel::Player.current
          player.user.state = 'end'
          player.user.save!
        #end
      end

      # FIXME: chenge this
      # increment game version
      DataModel::Game.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ DataModel::Game.current.channel ]}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'manage-state',
        :summary => summary
      )
      Madmass.current_perception << p
    end

    def applicable?
      unless DataModel::Game.current.winner
        why_not_applicable.publish(
          :name => :game_cannot_end,
          :key => 'action.game.cannot_end'
        )
      end

      return why_not_applicable.empty?
    end

  end

end
