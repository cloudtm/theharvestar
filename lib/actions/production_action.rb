# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class ProductionAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :game_id, :roll
    action_states :any

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      @production = DataModel::Terrain.produce @parameters
      
      # FIXME: chenge this
      # increment game version
      DataModel::Game.current.increase_version
      @production[:raw_players].each do |player|
        player.increase_version
      end
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      wasted_terrains = DataModel::Game.wasted_terrain_coords
      produce_perception = Madmass::Perception::Percept.new(self)
      produce_perception.add_headers({ :topics => [DataModel::Game.current.channel] }) #who must receive the percept
      produce_perception.data = {
        :event => 'update-production',
        :producing => @production[:producing_terrains], 
        :wasting => wasted_terrains
      }
      Madmass.current_perception << produce_perception

      @production[:raw_players].each do |player|
        percept = Madmass::Perception::Percept.new(self)
        percept.add_headers({ :clients => [ player.user_id ] }) #who must receive the percept        
        percept.data = player.to_percept.merge(
          :event => 'update-player',
          :version => DataModel::Game.current.version
        )
        Madmass.current_perception << percept
      end
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      @game_exists = DataModel::Game.set_current @parameters # done here because it needs to reload the game now and at every possible rollback

      unless @game_exists
        #name = @parameters[:game_name] ? @parameters[:game_name] : @parameters[:game_id]
        why_not_applicable.publish(
          :name => :game_named_not_exist, 
          #:message => I18n.t(:'action.game.named_not_exists'), 
          :key => 'action.game.named_not_exists',
          :subs => { :name => @parameters[:game_id] }, 
          :recipients => []
        )
      else
        if(DataModel::Game.current.state != 'playing')
          why_not_applicable.publish(
            :name => :game_ended, 
            #:message => I18n.t(:'action.game.ended'), 
            :key => 'action.game.ended',
            :recipients => []
          )
        end
      end
      return why_not_applicable.empty?
    end

  end

end
