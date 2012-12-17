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
