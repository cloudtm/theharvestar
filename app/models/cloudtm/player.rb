require 'challenges/transport_challenge'
require 'score'
require 'trader'

module Cloudtm
  class Player
    
    include CloudTm::Model
    include Madmass::Agent::Executor
    extend Challenges::TransportChallenge
    include Trader

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

    # Returns the player data needed by perceptions to send to the game client.
    # It uses the to_hash of ActiveRecord custom implementation (see initializes/active_record.rb).
    # Adds to the standard player data some other info like total_score, progresses end so on.
    def to_percept
      options = GameOptions.options(DataModel::Game.current.format)
      to_hash([:id, :user_id, :avatar, :slot, :total_score, :titanium, :magic_resource, :energy, :water, :silicon, :grain, :version]) do
        {
          :red_lab => {
            :social => unused_social_group_amount,
            :recycle => magic_resource,
            :transport =>  red_lab_roads.size
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

    # Increase the version to order the perceptions in the GUI. 
    def increase_version
      self.version ||= 0
      update_attribute(:version, self.version + 1)
    end

    def destroy_trade_request
      self.trade_request.offers.each do |offer|
        self.removeOffers(offer)
      end
      self.removeTradeRequest
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

      # Check if  pieces for building a specific infrastructure are depleted.
      def depleted?(infrastructure)
        association_name = infrastructure.to_s.pluralize
        placed = DataModel::Player.current.send(association_name).size
        available = GameOptions.options(DataModel::Game.current.format)[:"max_#{association_name}"]
        return placed == available unless placed > available
        raise Madmass::Errors::CatastrophicError, %Q{
           Inconsistent state:
           placed #{association_name} cannot be more than #{available}.
           Already (placed #{placed})
        }
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


    def initial_to_place(infrastructure)
      association_name = infrastructure.to_s.pluralize
      Rails.logger.debug "ASSOCIATION IS: #{association_name}"
      placed = send(association_name).size
      Rails.logger.debug "PLACED ARE: #{placed}"

      if(infrastructure == :road)
        # terrible: this two ugly lines of code have been added because
        # if you don't place your initial free roads before getting a transport progress,
        # you loose the chance of using them
        placed = placed - red_lab_roads.size
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
      red_progresses.select{|red_progress| red_progress.type == 'CulturalProgress' and red_progress.used }.size
    end

    #returns the amount of recycled resources used by the player
    def recycle_level
      recycle_count = red_progresses.select{|red_progress| red_progress.type == 'RecyclingProgress' and red_progress.used }.size
      ((recycle_count) * GameOptions.options(DataModel::Game.current.format)[:recycling_prize]) - attributes_to_hash[:magic_resource]
    end

    # Provides player unplaced road
    def unplaced_roads
      DataModel::Road.unplaced_roads_for_player(self)
    end

    # Provides player placed roads (x and y are not 0)
    def placed_roads
      roads.select{|road| (road.x != 0 and !road.x.nil?) or (road.y != 0 and !road.y.nil?)}
    end

    # Roads won with research and development.
    def red_lab_roads
      unplaced_roads.select{|road| road.from_progress }
    end

    # Provides the amount of the available social group
    def unused_social_group_amount
      return 0 unless red_progresses
      red_progresses.select{|red_progress| red_progress.type == 'SocialProgress' and (not red_progress.used) }.size
    end

    # Adapter to use the user association in the rails way
    def user
      User.find_by_id(user_id)
    end

    def user=(us)
      self.user_id = us.id
    end

    def destroy
      DataModel::Game.current.removePlayers(self) if DataModel::Game.current
    end

    # Returns true if involved player has enough resources to pay the costs.
    def can_buy? costs
      costs.each do |key, value|
        wallet = attributes_to_hash[key.to_sym]
        if (wallet < value.abs)
          return false
        end
      end
      return true
    end

    def pay! payment
      payment.each do |resource, income|
        total = self.send(resource) || 0
        update_attribute(resource, total + income)
        self.send("#{resource}=", total + income)
      end
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
      settlement_terrains.each { |terrain|
        resource_type = GameOptions.options(DataModel::Game.current.format)[terrain.terrain_type.to_sym]
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
        res = self.send(key) || 0
        res += value
        self.send("#{key}=", res)
      end
    end

    # Add a random research and development progress (RedProgress hierarchy).
    def add_progress!(progress = nil)
      begin
        progress = DataModel::RedProgress.factory(progress)
        self.add_red_progresses(progress)
        return progress
      rescue Exception => ex
        Rails.logger.error "Add progress error: #{ex.message}"
        Rails.logger.error ex.backtrace.join("\n")
        return nil
      end
    end


    # Returns the first progress associated to this player having the argument as name.
    # Note that the progress loaded is not used.
    def progress_by_name progress_name
      red_progresses.detect{|red_progress| red_progress.type == "#{progress_name.classify}Progress" and (not red_progress.used) }
    end

    #increment player magic resource amount. By default increment amount is made of one magic resource unit
    def add_magic_resource inc = 1
      update_attribute(:magic_resource, attributes_to_hash[:magic_resource] + inc)
    end

    private
      
    # Provides alla the colonies of a player
    def colonies
      settlements.select{ |settlement| settlement.level == 1 }
    end

    # Provides all the cities of a player
    def cities
      settlements.select{ |settlement| settlement.level == 2 }
    end

  end
end
