require 'game_states'

module Cloudtm
  class Game
    include CloudTm::Model
    include GameStates

    def initialize(*args)
      super
    end

    def attributes_to_hash
      {
        :id => id,
        :format => format,
        :state => state,
        :version => version,
        :social_count => social_count,
        :transport_count => transport_count,
        :channel => channel
      }
    end

    # Increase the version to order the perceptions in the GUI. 
    def increase_version
      self.version ||= 0
      update_attribute(:version, self.version + 1)
    end

    def to_json
      attributes_to_hash.to_json
    end

    def player_in_game?(player)
      players.map(&:id).include?(player.id)
    end

    def destroy
      app.removeGames(self)
    end

    def created_time
      Time.at(created_at.getTime/1000)
    end

    # Returns the column format (string) as symbol.
    def format_with_sym
      frmt = format_without_sym
      frmt ? frmt.to_sym : frmt
    end

    alias_method_chain :format, :sym

    # Returns the class name associated to the format.
    def format_class
      format.to_s.camelize
    end

    # Set the social leader and the social count.
    def update_social_leader(player, points)
      social_leader = player
      social_count = points
    end

    # Set the transport leader and the transport count.
    def update_transport_leader(player, points)
      transport_leader = player
      transport_count = points
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

      # Search the game by id (hash key :game_id) or by name (hash key :game_name)
      # and if found sets it to current game.
      # Return true if the game was found, false otherwise.
      def set_current options
        if options[:game_id]
          self.current = self.find_by_id(options[:game_id])
        else
          return false
        end

        return false unless self.current
        true
      end

      def factory params
        params[:format] = :base unless params[:format]
        map_terrains = params[:terrains] || Map::MapFactory.make(:type => params[:format])
        game = self.create(
          :name => params[:name],
          :format => params[:format],
          :state => initial_state,
          :created_at => java.util.Date.new,
          :version => 1
        )

        #game.update_attribute(:state, initial_state)
        # associate terrains with game
        map_terrains.each do |map_terrain|
          new_terrain = DataModel::Terrain.create(map_terrain)
          game.addTerrains(new_terrain)
        end
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


      def create_with_root attrs = {}, &block
        create_without_root(attrs) do |instance|
          app.add_games instance
        end
      end

      alias_method_chain :create, :root

      def all
        app.getGames
      end

      # Returns the list of active games.
      def all_by_states(states)
        find_by_states(states).map do |game|
          game.to_hash {|g| {:player_count => g.players.size}}
        end
      end

      def find_by_states(states)
        DataModel::Game.all.select{ |game| states.include?(game.state) }
      end

      def search(options)
        return all_by_states(options[:states]) if(options[:states])

        games = all.map do |game|
          game.to_hash {|g| {:player_count => g.players.size}}
        end
        games
      end

      def games_list(options)
        h_games = DataModel::Game.search(options)

        #FIXME use add_all_users and make this return an array of percepts
        h_games.each do |game|
          game[:users] = DataModel::Game.find_by_id(game[:id]).players.map do |player|
            player.user.to_hash([:id, :nickname, :state, :score]) do |user|
              {:player => player.to_hash([:id, :avatar, :slot, :ready]) }
            end if player.user
          end

        end
        h_games
      end

      # Return an array whose elements are couple of coords representing all the terrains currently affected by calamity
      def wasted_terrain_coords
        wasted_terrains.map{|t| [t.x,t.y]}
      end

      def wasted_terrains
        #game_calamities = Calamity.where(:game_id => Game.current.id)
        #game_calamities.map(&:terrain)
        []
      end

    end

    # Determines whether the game is full to prevent other players to join
    def full? game_id
      game = DataModel::Game.find_by_id game_id
      return (game.players.size >= GameOptions.options(game.format)[:max_player_limit])
    end

    def to_percept
      to_hash([:id, :transport_count, :channel, :state, :social_leader_id, :transport_leader_id, :social_count, :version, :winner_id])
    end

    # The name of communication channel (i.e., topic) associated to this game.
    def channel
      "game_#{id}"
    end

  end
end
