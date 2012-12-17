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
