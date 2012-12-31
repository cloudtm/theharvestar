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

# Buy a Research & Development Progress.
# === Applicability
# * Player has enough resources to buy the progress.
# === Trace
# * Current player
module Actions
  class BuyProgressAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :progress
    action_states :play


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      progress = DataModel::Player.current.add_progress! @parameters[:progress]
      progress.effect
      @progress_class = progress.class
      Score.update_score if @progress_class.affect_score?
      DataModel::Player.current.pay! options :development_cost
      
      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      DataModel::Game.current.players.each do |player|
        # CHECK IF NEEDS FRESH PLAYERS LIKE IN GVISION
        player.increase_version
      end
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :clients => [ User.current.id ] }) #who must receive the percept
      p.data = DataModel::Player.current.to_percept.merge(
        :event => 'update-player',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => [DataModel::Game.current.channel] }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :infrastructures => current_infrastructures,
        :event => 'update-game',
        :progress => @progress_class.name
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      unless DataModel::Player.current.can_buy?  options :development_cost
        why_not_applicable.publish(
          :name => :research_no_resource,
          :key => 'action.research.no_resource',
          :recipients => [User.current.id]
        )
      end

      return why_not_applicable.empty?
    end

  end

end
