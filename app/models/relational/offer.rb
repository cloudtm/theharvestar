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

module Relational
  class Offer < ActiveRecord::Base
   
    # can mass assign some attributes
    attr_accessible :trader, :receive, :give , :last_trader, :publisher_agrees, :trader_agrees

    belongs_to :trader, :class_name => "::DataModel::Player"
    belongs_to :trade_request

    validates  :trader, :presence => true
    validates  :give, :presence => true
    validates  :receive, :presence => true

    serialize :give, Hash
    serialize :receive, Hash

    class << self

      # Returns the publisher and the trader for the offer
      def info offer_id
        offer = find_by_id offer_id
        receive = offer.receive.select{|r,c| c > 0}.map{|r| "#{r[1]} #{r[0] == 'grain' ? 'food': r[0]}" }.join(', ') # receive resources string ("1 titanium, 2 energy, ...")
        give = offer.give.select{|r,c| c > 0}.map{|g| "#{g[1]} #{g[0] == 'grain' ? 'food' : g[0]}" }.join(', ')  # give resources string ("1 titanium, 2 energy, ...")
        {
          :publisher => offer.publisher.user.nickname,
          :trader => offer.trader.user.nickname,
          :receive => receive.any? ? receive : "nothing",
          :give => give.any? ? give : "nothing"
        }
      end

      def exists offer_id
        not find_by_id(offer_id).nil?
      end

      def current_can_trade? offer_id
        offer = find_by_id offer_id
        offer.current_can_trade?
      end

      def can_be_payed? offer_id
        offer = find_by_id offer_id
        offer.can_be_payed?
      end

      def accept! offer_id
        offer = find_by_id offer_id
        offer.accept!
      end

      def destroy_trade_request offer_id
        offer = find_by_id offer_id
        offer.trade_request.destroy if offer.accepted?
      end

      def turn_for_current? offer_id
        offer = find_by_id(offer_id)
        offer.turn_for_current?
      end

      def counter_offer options
        offer = find_by_id(options[:offer])
        offer.counter_offer options
      end

      def trade_request offer_id
        offer = find_by_id(offer_id)
        offer.trade_request
      end
    end

    # Determines if the current player is a valid trader for this offer.
    # A valid trader can be the offer's trader or the publisher of the trade request
    # associated to this offer.
    def current_can_trade?
      current_is_trader? or current_is_publisher?
    end

    # Updates the offer state with the counter offer values.
    def counter_offer options
      update_attributes(
        :give => options[:give],
        :receive => options[:receive],
        :message => options[:message],
        :last_trader => DataModel::Player.current.id,
        # when a player counter offer automatically accept the offer
        # reset all previous agreement
        :trader_agrees => current_is_trader?,
        :publisher_agrees => current_is_publisher?
      )
    end

    # Check if the current player can place a counter offer.
    def turn_for_current?
      # the player cannot be the last one who placed this offer
      last_trader != DataModel::Player.current.id
    end

    # Returns true if the offer is accepted by all players associated to it.
    def accepted?
      publisher_agrees and trader_agrees
    end

    # Consume the exchange between players according to the offer.
    # Before consume check that all players accepted the offer.
    def accept!
      current_agrees
      # if all players accepted then consume the offer
      if accepted?
        # update publihser
        publisher.pay! cost give
        publisher.pay! receive

        #update trader
        trader.pay! cost receive
        trader.pay! give

        DataModel::Player.current.reload
      end
    end

    def publisher
      trade_request.publisher
    end

    def can_be_payed?
      publisher.can_buy?(give) and trader.can_buy?(receive)
    end
    
    private

    # Set the offer accepted by the current player.
    def current_agrees
      if current_is_trader?
        update_attribute :trader_agrees, true
      elsif current_is_publisher?
        update_attribute :publisher_agrees, true
      end
    end

    # Returns true if the current player is the offer trader.
    def current_is_trader?
      DataModel::Player.current == trader
    end

    # Returns true if the current player is the offer publisher.
    def current_is_publisher?
      DataModel::Player.current == publisher
    end

    # Provides the cost for the resources traded in the offer.
    def cost resources
      cost = HashWithIndifferentAccess.new
      resources.each do |key,val|
        cost[key] = -val
      end
      cost
    end
    
  end
end
