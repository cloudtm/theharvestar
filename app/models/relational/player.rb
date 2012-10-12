module Relational
  class Player < ActiveRecord::Base
    include Madmass::Agent::Executor
    attr_accessible :state

    belongs_to :user
    belongs_to :game

    class << self
      # Sets the current player
      def current=(player)
        Thread.current[:player] = player
      end

      # Note: current player is set by User in Thread
      def current
        Thread.current[:player]
      end

      def ready(ready, demo = false)
        current.ready = ready
        current.save!
        # refresh the player in the memory in the current Game and User
        User.current.player = current
        player_index = DataModel::Game.current.players.index(current)
        DataModel::Game.current.players[player_index] = current
        demo ? DataModel::Game.current.demo : DataModel::Game.current.ready
      end

      def ready?
        current.ready
      end
    end

    def add_game(_game)
      game = _game
    end

    alias addGame add_game


  end
end