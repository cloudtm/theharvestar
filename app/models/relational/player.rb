module Relational
  class Player < ActiveRecord::Base
    
    include Madmass::Agent::Executor
    attr_accessible :state

    belongs_to :user
    belongs_to :game, :class_name => '::DataModel::Game'
    has_many :settlements, :class_name => '::DataModel::Settlement', :dependent => :destroy
    has_many :roads, :class_name => '::DataModel::Road', :dependent => :destroy

    # challenges section
    has_one :game_social_leader, :class_name => '::DataModel::Game', :foreign_key => 'social_leader_id'
    has_one :game_transport_leader, :class_name => '::DataModel::Game', :foreign_key => 'transport_leader_id'
    has_one :game_winner, :class_name => '::DataModel::Game', :foreign_key => 'winner_id'

    # TODO
    # has_many :offers, :foreign_key => 'trader_id', :dependent => :destroy
    # has_one :trade_request, :foreign_key => 'publisher_id', :dependent => :destroy
    # has_many :red_progresses, :dependent => :destroy

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
        player_index = 0
        DataModel::Game.current.players.each_with_index do |pl, index|
          if pl.id == current.id
            player_index = index
            break
          end
        end
        #player_index = DataModel::Game.current.players.index(current)
        DataModel::Game.current.players[player_index] = current
        demo ? DataModel::Game.current.demo : DataModel::Game.current.ready
      end

      def ready?
        current.ready
      end
    end

    #def add_game(_game)
    #  game = _game
    #end

    #alias addGame add_game

    # Returns the player data needed by perceptions to send to the game client.
    # It uses the to_hash of ActiveRecord custom implementation (see initializes/active_record.rb).
    # Adds to the standard player data some other info like total_score, progresses end so on.
    def to_percept
      options = GameOptions.options(DataModel::Game.current.format)
      to_hash([:id, :user_id, :avatar, :slot, :total_score, :titanium, :magic_resource, :energy, :water, :silicon, :grain, :version]) do
        {
          :red_lab => {
            :social => unused_social_group_amount,
            :recycle=> magic_resource,
            :transport =>  unplaced_roads.size
          },
          :red_history => {
            :social_level => social_level,
            :cultural_level => cultural_level,
            :recycle_level => recycle_level,
            :transport_level => transport_level
          },
          :bonuses => {
            :links => [0, initial_to_place(:road)].max,
            :outposts => [0, options[:init_settlements] - settlements.size].max
          },
          :total_score => total_score
        }
      end
    end

    # Returns the player data needed by the interface to beautify the interface (i.e images and so on).
    def to_info
      {
        :id => id,
        :image => user.picture.url(:small),
        :name => user.nickname,
        :score => user.score,
        :slot => slot,
        :avatar => avatar,
        :user => user.id
      }
    end

    def initial_to_place(infrastructure)
      association_name = infrastructure.to_s.pluralize
      placed = send(association_name).size

      if (infrastructure == :road)
        # terrible: this two ugly lines of code have been added because
        # if you don't place your initial free roads before getting a transport progress,
        # you loose the chance of using them
        # TODO
        #red_road = ((red_progresses.where('type = ?', 'TransportProgress').count) * GameOptions.options(DataModel::Game.current.format)[:transport_amount])
        red_road = 0
        placed = placed - red_road
      end

      available = GameOptions.options(DataModel::Game.current.format)[:"init_#{association_name}"]
      return available - placed
    end

    def total_score
      return Score.total_score(self)
    end

    def transport_level
      return Score.transport_level(self)
    end

    def social_level
      return Score.social_level(self)
    end


    def cultural_level
      0 #self.red_progresses.where('type = ? and used = ?', 'CulturalProgress', true).count
    end

    #returns the amount of recycled resources used by the player
    def recycle_level
      0 #((self.red_progresses.where('type = ?', 'RecyclingProgress').count) * GameOptions.options(DataModel::Game.current.format)[:recycling_prize]) - self.magic_resource
    end

    # Provides  player unplaced road
    def unplaced_roads
      roads.find(:all, :conditions => "x = 0  and y = 0")
    end

    # Provides the amount of the available social group
    def unused_social_group_amount
      0 #self.red_progresses.where('type = ? and used = ?', 'SocialProgress', false).count
    end

     # Returns true if involved player has enough resources to pay the costs.
    def can_buy? costs
      costs.each do |key, value|
        wallet = attributes[key]
        wallet = attributes[key.to_s] unless wallet #dirty hack. #TODO FIXME
        if (wallet < value.abs)
          return false
        end
      end
      return true
    end

    def pay! payment
      payment.each do |resource, income|
        total = self.send(resource)
        self.send("#{resource}=", total + income)
      end
      self.save!
    end

    # This method is used in to implements one of the postconditions of the settlement initial placement.
    # For each productive terrain reached by the settlement it adds on resource to the player.
    def init_resources target
      settlement_terrains = DataModel::Terrain.find_by_hexes(target.hexes)
      resources = {}
      settlement_terrains.each { |t|
        resource_type = GameOptions.options(DataModel::Game.current.format)[t.terrain_type]
        unless resource_type.nil?
          resources[resource_type] ||= 0
          resources[resource_type] += 1
        end
      }
      DataModel::Player.current.update_resources(resources)
    end

    # Increment player resources with values in the hash passed as method parameter.
    def update_resources(resources)
      resources.each do |key, value|
        res = self.send(key)
        res += value
        self.send("#{key}=", res)
      end
      self.save
    end

  end
end