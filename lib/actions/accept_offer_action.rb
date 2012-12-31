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

# Accept an offer.
module Actions
  class AcceptOfferAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :offer
    action_states :play

  
    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      DataModel::Offer.accept!(@parameters[:offer])
      
      # FIXME: chenge this
      # increment game and player version
      DataModel::Game.current.increase_version
      DataModel::Player.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      players = DataModel::Game.current.players
      trade_request_perception = trade_request(DataModel::Offer.trade_request(@parameters[:offer]))
      publisher = players.detect{|pl| pl.id == trade_request_perception[:publisher_id]}
      # the accepted offer is accepted from both publisher and trader.
      accepted_offer = trade_request_perception[:offers].detect {|offer| offer[:trader_agrees] && offer[:publisher_agrees]}

      # sends the resource update to the publisher if accepted_offer (accepted_offer should always be present)
      if(accepted_offer)
        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ publisher.user.id ] }) #who must receive the percept
        percept.data = publisher.to_percept.merge(
          :event => 'update-player',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end

      # send the entire trade request to the publisher
      percept = Madmass::Perception::Percept.new(self)
      percept.add_headers({ :clients => [ publisher.user.id ] }) #who must receive the percept
      percept.data = trade_request_perception.merge(
        :event => 'end-trade',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << percept

      # send the offers to the specifics traders
      trade_request_perception[:offers].each do |offer|
        trader = players.detect{|pl| pl.id == offer[:trader_id]}
        # sends the resource update to the trader if any (should always be present)
        if(trader.id == accepted_offer[:trader_id])
          percept = Madmass::Perception::Percept.new(self)
          percept.add_headers({ :clients => [ trader.user.id ] }) #who must receive the percept
          percept.data = trader.to_percept.merge(
            :event => 'update-player',
            :version => DataModel::Game.current.version
          )
          Madmass.current_perception << percept
        end
        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ trader.user.id ] }) #who must receive the percept
        percept.data = offer.merge(
          :event => 'end-offer',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end

      # notify message
      info = DataModel::Offer.info(@parameters[:offer])
      percept = Madmass::Perception::Percept.new(self)
      percept.add_headers({ :topic => [ DataModel::Game.current.channel ] }) #who must receive the percept
      percept.data = {
        :event => 'info-mechanics',
        :version => DataModel::Game.current.version,
        :type => 'market',
        :key => 'action.market.offer_accepted',
        :subs => {:publisher => info[:publisher], :trader => info[:trader], :give => info[:give], :receive => info[:receive]}
      }
      Madmass.current_perception << percept

      # when the perception is generated the trade request can be destroyed
      DataModel::Offer.destroy_trade_request(@parameters[:offer])
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

        # all players must have the resources that will pay
        unless DataModel::Offer.can_be_payed?(@parameters[:offer])
          why_not_applicable.publish(
            :name => :market_no_resources,
            :key => 'action.market.no_resources'
          )
        end
      end        

      return why_not_applicable.empty?
    end

  end

end
