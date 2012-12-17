module Relational
  class Player < ActiveRecord::Base
    
    include Madmass::Agent::Executor
    extend Challenges::TransportChallenge
    include Trader

    attr_accessible :state

    belongs_to :user
    belongs_to :game, :class_name => '::DataModel::Game'
    has_many :settlements, :class_name => '::DataModel::Settlement', :dependent => :destroy
    has_many :roads, :class_name => '::DataModel::Road', :dependent => :destroy

    # challenges section
    has_one :game_social_leader, :class_name => '::DataModel::Game', :foreign_key => 'social_leader_id'
    has_one :game_transport_leader, :class_name => '::DataModel::Game', :foreign_key => 'transport_leader_id'
    has_one :game_winner, :class_name => '::DataModel::Game', :foreign_key => 'winner_id'

    has_many :offers, :class_name => '::DataModel::Offer', :foreign_key => 'trader_id', :dependent => :destroy
    has_one :trade_request, :class_name => '::DataModel::TradeRequest', :foreign_key => 'publisher_id', :dependent => :destroy
    has_many :red_progresses, :class_name => '::DataModel::RedProgress', :dependent => :destroy

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

      # Check if  pieces for building a specific infrastructure are depleted.
      def depleted?(infrastructure)
        association_name = infrastructure.to_s.pluralize
        placed = DataModel::Player.current.send(association_name).size
        available = GameOptions.options(DataModel::Game.current.format)[:"max_#{association_name}"]
        return placed == available unless placed > available
        raise GameError::CatastrophicError, %Q{
           Inconsistent state:
           placed #{association_name} cannot be more than #{available}.
           Already (placed #{placed})
        }
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
            :transport =>  red_lab_roads.count
          },
          :red_history => {
            :social_level => social_level,
            :cultural_level => cultural_level,
            :recycle_level => recycle_level,
            :transport_level => transport_level
          },
          :bonuses => {
            :links => [0, initial_to_place(:road)].max,
            :outposts => [0, options[:init_settlements] - settlements.count].max
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

    # Increase the version to order the perceptions in the GUI. 
    def increase_version
      # using the optimistic locking on version column so cannot increment 
      # version directly, we force the activerecord callback by updating the 
      # updated_at attribute.
      update_attribute(:updated_at, Time.now)
    end

    def initial_to_place(infrastructure)
      association_name = infrastructure.to_s.pluralize
      placed = send(association_name).count
      
      if (infrastructure == :road)
        # terrible: this two ugly lines of code have been added because
        # if you don't place your initial free roads before getting a transport progress,
        # you loose the chance of using them
        placed = placed - red_lab_roads.count
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
      self.red_progresses.where('type = :type and used = :used', {:type => 'Relational::CulturalProgress', :used => true}).count
    end

    #returns the amount of recycled resources used by the player
    def recycle_level
      recycle_count = self.red_progresses.where('type = :type and used = :used', {:type => 'Relational::RecyclingProgress', :used => true}).count
      ((recycle_count) * GameOptions.options(DataModel::Game.current.format)[:recycling_prize]) - self.magic_resource
    end

    # Provides player unplaced roads (x and y are 0)
    def unplaced_roads
      roads.where(:x => 0, :y => 0)
    end

    # Provides player placed roads (x and y are not 0)
    def placed_roads
      roads.where("x <> :x and y <> :y", {:x => 0, :y => 0})
    end

    # Roads won with research and development.
    def red_lab_roads
      unplaced_roads.where(:from_progress => true)
    end

    # Provides the amount of the available social group
    def unused_social_group_amount
      self.red_progresses.where('type = :type and used = :used', {:type => 'Relational::SocialProgress', :used => false}).count
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

    # Decrements player resources accordingly to the construction cost
    # Note: if you get an exception "NoMethodError: undefined method `<' for nil:NilClass"
    # it could mean that you have a wrong definition of costs in game_options.yml:
    # a key in costs could not be a (payable resource) attribute of Player
    # receive is a pay action with positive income. The income is defined in the game_options.yml
    alias receive! pay!

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

    # Add a random research and development progress (RedProgress hierarchy).
    def add_progress!(progress = nil)
      begin
        progress = DataModel::RedProgress.factory(progress)
        self.red_progresses << progress
        return progress
      rescue Exception => ex
        Rails.logger.error "Add progress error: #{ex.message}"
        Rails.logger.error ex.backtrace.join("\n")
        return nil
      end
    end

    def add_offers(offer)
      self.offers << offer
    end


    # Returns the first progress associated to this player having the argument as name.
    # Note that the progress loaded is not used.
    def progress_by_name progress_name
      red_progresses.where('type = :type and used = :used', {:type => "Relational::#{progress_name.classify}Progress", :used => false}).first
    end

    #increment player magic resource amount. By default increment amount is made of one magic resource unit
    def add_magic_resource inc = 1
      update_attribute(:magic_resource, self.magic_resource + inc)
    end

    def destroy_trade_request
      trade_request.destroy
    end

    private

    # Provides alla the colonies of a player
    def colonies
      settlements.find(:all, :conditions => "level = 1")
    end

    # Provides all the cities of a player
    def cities
      settlements.find(:all, :conditions => "level = 2")
    end

  end
end