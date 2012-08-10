module Cloudtm
  class Game
    include CloudTm::Model

    def attributes_to_hash
      {
        :id => oid,
        :format => format,
        :state => state,
        :version => version,
        :social_count => social_count,
        :transport_count => transport_count
      }
    end

    def to_json
      attributes_to_hash.to_json
    end

    class << self

      # Assigns the current game in the thread hash.
      def current=(game)
        Thread.current[:game] = game
      end

      # Reads the current game from the thread hash.
      def current
        Thread.current[:game]
      end

      def factory params
        params[:format] = :base unless params[:format]
        # map_terrains = params[:terrains] || Map::MapFactory.make(:type => params[:format])
        game = self.create(:name => params[:name], :format => params[:format])
        # map_terrains.each{|terrain| terrain[:game_id] = game.id} #adds game id to generated terrains, so they will be creted already associated
        # Terrain.create_from_hash(map_terrains) # TODO Replace with ActiveRecord import extension
        # Calamity.create(:game_id => game.id)
        self.current = game
        # Calamity.move_to_base
        game.to_hash
      end

      def count
        0
      end

      # Returns the hash representation of the current game
      def to_hash
        Game.current ? Game.current.to_hash : {}
      end

      def find(oid)
        _oid = oid #Now ids are strings !! .to_i
        all.each do |game|
          return game if game.oid == _oid
        end
        return nil
      end

      def create_with_root attrs = {}, &block
        create_without_root(attrs) do |instance|
          instance.set_root manager.getRoot
        end
      end

      alias_method_chain :create, :root

      def all
        manager.getRoot.getGames
      end

    end

    def to_hash
      {}
    end

  end
end
