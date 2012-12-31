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
  class PlaceTradeRequestAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :receive, :give
    action_states :play

    def process_params
      # Converts resource count from strings to integers
      convert = @parameters[:receive]
      convert.each do |resource, count|
        convert[resource] = count.to_i
      end
      convert = @parameters[:give]
      convert.each do |resource, count|
        convert[resource] = count.to_i
      end    
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # create the trade request
      DataModel::Player.request_trade(@parameters)
      
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
      trade_request_perception = trade_request(DataModel::Player.current.trade_request)
      percept = Madmass::Perception::Percept.new(self)
      percept.add_headers({ :clients => [ User.current.id ] }) #who must receive the percept
      percept.data = trade_request_perception.merge(
        :event => 'update-trade',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << percept

      players = DataModel::Game.current.players
      Rails.logger.debug "TRADE REQUEST: #{trade_request_perception.inspect}"
      trade_request_perception[:offers].each do |offer|
        trader = players.detect{|player| player.id == offer[:trader_id]}
        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ trader.user.id ] }) #who must receive the percept
        percept.data = offer.merge(
          :event => 'update-offer',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      # a player can have only one trade request per time
      if DataModel::Player.has_trade_request?
        why_not_applicable.publish(
          :name => :market_already_trading,
          :key => 'action.market.already_trading'
        )
      end
      return why_not_applicable.empty?
    end

  end

end
