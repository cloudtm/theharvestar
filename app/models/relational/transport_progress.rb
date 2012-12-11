module Relational
  # This class represents the Transport Research & Development Progress.
  # If the player uses this development progress gains N (amount specified in Game Options: transport_amount)
  # railway (class Road) that can be placed without paying when he prefers.
  class TransportProgress < RedProgress

    #def applicable?
    # options = GameOptions.options(Game.current.format)
    # @transport_amount = (Player.current.roads.size + options[:transport_amount] <= options[:max_roads]) ? options[:transport_amount] : (options[:max_roads] - Player.current.roads.size)
    # @transport_amount > 0
    #end

    def effect
      options = GameOptions.options(DataModel::Game.current.format)
      @transport_amount = (DataModel::Player.current.roads.size + options[:transport_amount] <= options[:max_roads]) ? options[:transport_amount] : (options[:max_roads] - DataModel::Player.current.roads.size)
      @transport_amount.times{ DataModel::Road.build_from_progress }
      used!
    end

    class << self
      def selectable?
        !DataModel::Player.depleted?(:road)
      end
    end

  end
end