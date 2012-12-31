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

# Close the offer.
module Actions
  class CounterOfferAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :offer, :give, :receive, :message
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
      DataModel::Offer.counter_offer @parameters

      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      DataModel::Player.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      offer_percept = offer(@parameters[:offer])
      # send the offers to the specific publisher and trader
      offer_percept[:trade_request][:offers].each do |offer|
        if(offer[:trader_agrees])
          # send the offer update to the publisher
          publisher = offer_percept[:players].detect{|pl| pl[:id] == offer_percept[:trade_request][:publisher_id]}          
          recipient = publisher[:user_id]
        else
          # send the offer update to the trader
          trader = offer_percept[:players].detect{|pl| pl[:id] == offer[:trader_id]}
          recipient = trader[:user_id]
        end

        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ recipient ] }) #who must receive the percept
        percept.data = offer.merge(
          :event => 'update-offer',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end
    end

    # The action is applicable if:
    # * I am the publisher o the trader of the offer
    # * Is my turn. When a player places a counter offer he must wait that the
    # other player responds with its counter offer.
    def applicable?
      # rollback proof assignment
      @offer_exists = DataModel::Offer.exists(@parameters[:offer])

      unless @offer_exists
        why_not_applicable.publish(
          :name => :market_offer_not_exists,
          :key => 'action.market.offer_not_exists'
        )
      else
        # check that the current player is a valid trader
        unless DataModel::Offer.current_can_trade?(@parameters[:offer])
          why_not_applicable.publish(
            :name => :market_not_offer_trader,
            :key => 'action.market.not_offer_trader'
          )
        end

        # check that this is the turn of current player.
        unless DataModel::Offer.turn_for_current?(@parameters[:offer])
          why_not_applicable.publish(
            :name => :market_not_your_turn,
            :key => 'action.market.not_your_turn'
          )
        end
      end

      return why_not_applicable.empty?
    end

  end

end
