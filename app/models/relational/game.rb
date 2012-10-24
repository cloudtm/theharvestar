# A game represents an active match among players. As such, it contains a description of the map (terrains)
# the set of players currently playing and the placed infrastructures (settlements and roads).
# When a game ends, the associated object is removed from the DB.
module Relational
  class Game < ActiveRecord::Base
    #SPOSTARE IN UN MODULO STATS
    #serialize :stats, Hash


    # can mass assign some attributes
    attr_accessible :name, :format, :state
    self.locking_column = :version

    include GameStates

    #Available game formats, being :base the simplest one.
    GAME_FORMATS = [:base] unless defined? GAME_FORMATS

    include Relational::Versionable

    has_many :players, :dependent => :destroy
    has_many :terrains, :dependent => :destroy
    has_many :settlements, :dependent => :destroy #FIXME Remove? check in test suite before remove
    has_many :roads, :dependent => :destroy #FIXME Remove? check in test suite before remove
    #has_one  :calamity, :dependent => :destroy
    # challenges section
    belongs_to :social_leader, :class_name => '::DataModel::Player'
    belongs_to :transport_leader, :class_name => '::DataModel::Player'
    # winner
    belongs_to :winner, :class_name => '::DataModel::Player'

    validates :name, :presence => true
    validate :game_format

    # The name of communication channel (i.e., topic) associated to this game.
    def channel
      "game_#{id}"
    end

    # Returns the column format (string) as symbol.
    def format
      frmt = read_attribute(:format)
      frmt ? frmt.to_sym : frmt
    end

    # Returns the class name associated to the format.
    def format_class
      format.to_s.camelize
    end

    # Determines whether the game is full to prevent other players to join
    def full? game_id
      return (players.size >= GameOptions.options(format)[:max_player_limit])
    end

    def to_percept
      to_hash([:id, :transport_count, :channel, :state, :social_leader_id, :transport_leader_id, :social_count, :version, :winner_id])
    end

    def player_in_game?(player)
      players.map(&:id).include?(player.id)
    end

    def created_time
      created_at
    end

    class << self

      # Returns the avarage rank of game users (or provided users in the param)
      # in respect to the overall user ranking.
      #def rank(users = nil)
      #  sum = 0.0
      #  count = 0
      #  if(users)
      #    users.each do |user|
      #      sum += user[:score]
      #      count += 1
      #    end
      #  else
      #    Game.current.players.each do |player|
      #      sum += player.user.score
      #      count += 1
      #    end
      #  end
      #  User.rank(sum/count)
      #end

      # Returns the hash representation of the current game
      def to_hash
        DataModel::Game.current ? DataModel::Game.current.to_hash : {}
      end

      # Returns the format of the current game (e.g., :base)
      #def format
      #  DataModel::Game.current ? DataModel::Game.current.format : nil
      #end

      # Returns the format of the current game (e.g., :base)
      #def format_class
      #  DataModel::Game.current ? DataModel::Game.current.format_class : nil
      #end

      # Generates a new game instance, including the terrains
      # that constitute its map
      def factory params
        #create map
        params[:format] = :base unless params[:format]
        map_terrains = params[:terrains] || Map::MapFactory.make(:type => params[:format])
        game = self.create_from_hash(:name => params[:name], :format => params[:format], :state => initial_state)
        #adds game id to generated terrains, so they will be created already associated
        map_terrains.each{|terrain| terrain[:game_id] = game.id}
        DataModel::Terrain.create_from_hash(map_terrains)
        #Calamity.create(:game_id => game.id)
        self.current = game
        #Calamity.move_to_base
        game.to_hash
      end

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
        logger.debug "GAMEID: #{options[:game_id]} - OPTIONS: #{options.inspect}"
        if options[:game_id]
          self.current = self.find_by_id(options[:game_id])
        else
          return false
        end

        return false unless self.current
        true
      end

      # options: {...}:
      #   :states => [array of states]
      #   :text => String (searched in game name and user name columns)
      def search(options)
        if(options[:text])
          search_params = ["%#{options[:text]}%"] * 6
          players = DataModel::Player.includes(:game, :user)
          players = players.where('games.state IN (?)', options[:states]) if options[:states]
          players = players.where('games.name LIKE ? OR users.first_name LIKE ? OR users.last_name LIKE ? OR users.middle_name LIKE ? OR users.name LIKE ? OR users.nickname LIKE ?', *search_params)
          return players.map{|player| player.game.to_hash {|g| {:player_count => g.players.size}} }
        else
          if(options[:states])
            return all_by_states(options[:states])
          else
            return all.map do |game|
              game.to_hash {|g| {:player_count => g.players.size}}
            end
          end
        end
      end

      # Returns the list of active games.
      def all_by_states(states)
        where(:state => states).map do |game|
          game.to_hash {|g| {:player_count => g.players.size}}
        end
      end

      def find_by_states(states)
        where(:state => states)
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

      #def current_rank
      #  #returns an array of hash {:id => player.id, :score =>player.total_score,:rank=> rank}, ordered by total_score.
      #  scores  = []
      #  Game.current.players.each{|p|
      #    scores<<{:id => p.id,:score =>p.total_score}
      #  }
      #  scores.sort! {|x,y| y[:score] <=> x[:score]}
      #  scores.each_with_index do |p,i|
      #    p.merge!({:rank => i+1})
      #  end
      #end
    end

    # Set the social leader and the social count.
    #def update_social_leader(player, points)
    #  update_attributes(
    #    :social_leader => player,
    #    :social_count => points
    #  )
    #end

    # Set the transport leader and the transport count.
    #def update_transport_leader(player, points)
    #  update_attributes(
    #    :transport_leader => player,
    #    :transport_count => points
    #  )
    #end

    # Returns all users associated with this game.
    #def users
    #  players.map(&:user)
    #end

    # Returns all players of this game reloading them from the db.
    #def fresh_players
    #  players.reset
    #  players
    #end

    private

    # Returns the format of the game. For example, the :base game as described in GameOptions.yml
    def game_format
      valid_format = GAME_FORMATS.include?(format)
      errors.add(:format, 'is not allowed') unless valid_format
      return valid_format
    end

    def games_list(options)
      return []
      h_games = DataModel::Game.search(options)

      #FIXME use add_all_users and make this return an array of percepts
      h_games.each do |game|
        game[:users] = DataModel::Game.find_by_id(game[:id]).players.map do |player|
          player.user.to_hash([:id, :nickname, :state, :score]) do |user|
            {:player => player.to_hash([:id, :avatar, :slot, :ready]) }
          end if player.user
        end

      end
      percept[:games_list] = h_games
    end

  end
end
