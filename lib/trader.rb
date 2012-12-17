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
