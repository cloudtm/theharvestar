module Cloudtm
  class Player
    include CloudTm::Model
    include Madmass::Agent::Executor

    def attributes_to_hash
      {
        :id => id,
        :state => state,
        :avatar => avatar || 'none',
        :slot => slot || 1,
        :ready => ready,
        :user_id => user_id,
        :silicon => silicon || 0, 
        :energy => energy || 0, 
        :water => water || 0, 
        :titanium => titanium || 0, 
        :grain => grain || 0, 
        :score => score || 0, 
        :magic_resource => magic_resource || 0
      }
    end

    def to_json
      attributes_to_hash.to_json
    end

    # Adapter to use the user association in the rails way
    def user
      @user ||= User.find_by_id(user_id)
    end

    def user=(us)
      @user = us
    end

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
        # refresh the player in the memory in the current Game and User
        #User.current.player = current #FIXME, is it needed?
        #DataModel::Game.current.players.each do |player|
        #  if(current.id == player.id)
        #    player = current
        #    break
        #  end
        #end
        demo ? DataModel::Game.current.demo : DataModel::Game.current.ready
      end

      def ready?
        current.ready
      end

      def create_with_root attrs = {}, &block
        create_without_root(attrs) do |instance|
          app.add_players instance
        end
      end

      alias_method_chain :create, :root

      def all
        app.getPlayers
      end

    end
  end
end
