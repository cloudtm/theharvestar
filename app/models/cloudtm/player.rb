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
      return 0#Score.total_score(self)
    end

    def transport_level
      return 0 #Score.transport_level(self)
    end

    def social_level
      return 0 #Score.social_level(self)
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
      roads.select{|road| road.x == 0 and road.y == 0 }
    end

    # Provides the amount of the available social group
    def unused_social_group_amount
      0 #self.red_progresses.where('type = ? and used = ?', 'SocialProgress', false).count
    end

    # Adapter to use the user association in the rails way
    def user
      Rails.logger.debug "@@@@@@@@@@@@@@@@@ READ USERID: [#{user_id}] @@@@@@@@@@@@@@@@@@@@@"
      User.find_by_id(user_id)
    end

    def user=(us)
      self.user_id = us.id
    end

    def destroy
      DataModel::Game.current.removePlayers(self)
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
