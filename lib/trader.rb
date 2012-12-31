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

module Trader

  def self.included base
    base.class_eval do
      include InstanceMethods
      extend ClassMethods
    end
  end

  module InstanceMethods
    # Closes the trade request published.
    def close_trade_request
      if trade_request
        self.destroy_trade_request
        reload
      end

    end
  end

  module ClassMethods
    # The current player already has a trade request?
    def has_trade_request?
      not current.trade_request.nil?
    end

    def request_trade(options)
      give = options.delete(:give)
      new_request = DataModel::TradeRequest.create(options)
      # creates an offer for all other players
      DataModel::Game.current.players.each do |player|
        next if player == DataModel::Player.current
        new_request.add_offers DataModel::Offer.create(
          :trader => player,
          :receive => options[:receive],
          :give => give,
          :last_trader => DataModel::Player.current.id,
          :publisher_agrees => true
        )
      end
      current.trade_request = new_request
      current.save!
    end
  end
end
