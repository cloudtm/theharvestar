# Close the offer.
module Actions
  class CloseTradeRequestAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_states :play

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      @trade_request_perception = trade_request(DataModel::Player.current.trade_request)
      DataModel::Player.current.close_trade_request
      
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
      # send the entire trade request to the publisher
      players = DataModel::Game.current.players
      publisher = players.detect{|pl| pl.id == @trade_request_perception[:publisher_id]}
      percept = Madmass::Perception::Percept.new(self)
      percept.add_headers({ :clients => [ publisher.user_id ] }) #who must receive the percept
      percept.data = @trade_request_perception.merge(
        :event => 'end-trade',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << percept

      # send the offers to the specifics traders
      @trade_request_perception[:offers].each do |offer|
        trader = players.detect{|pl| pl.id == offer[:trader_id]}
        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ trader.user_id ] }) #who must receive the percept
        percept.data = offer.merge(
          :event => 'end-offer',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end

    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      # the player must have a trade request
      if !DataModel::Player.has_trade_request?
        why_not_applicable.publish(
          :name => :trade_not_exists,
          :key => 'action.trade_not_exists'
        )
      end

      return why_not_applicable.empty?
    end

  end

end
