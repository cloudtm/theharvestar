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
  class BuildStationAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :target
    action_states :play

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    def process_params
      @parameters[:target] = Map::Hex::Vertex.factory(@parameters[:target])
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # Build the city
      DataModel::Settlement.upgrade @parameters[:target]
      # consume the resources (unless we are in the initial placement phase)
      DataModel::Player.current.pay! options(:city_cost)
      # update the score
      Score.increase_score options(:settlement_score_increment)
      Score.update_score
      
      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      DataModel::Player.current.increase_version
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
        :event => 'update-game'
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?

      if DataModel::Player.depleted? :city
        why_not_applicable.publish(
          :name => :build_pieces_depleted, 
          :key => 'action.build.pieces_depleted',
          :subs => {:type => 'station'},
          :level => 1, 
          :recipients => [User.current.id]
        )
      end

      # Check if the player has enough resources for building a new link or if he owns free links (initial links or R&D links)
      unless DataModel::Player.current.can_buy?  options :city_cost
        why_not_applicable.publish(
          :name => :build_no_resource,
          :key => 'action.build.no_resource',
          :subs => {:type => 'station'},
          :recipients => [User.current.id]
        )
      end

      # Check if the target is a colony
      unless DataModel::Settlement.colony? @parameters[:target]
        why_not_applicable.publish(
          :name => :station_not_legal,
          :key => 'action.station.not_legal',
          :recipients => [User.current.id]
        )
      end

      return why_not_applicable.empty?
    end



  end

end
