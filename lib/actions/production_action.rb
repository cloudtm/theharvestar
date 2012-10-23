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
      #trace :current, :game
      #trace :players, @production[:raw_players]
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => DataModel::Game.current.channel }) #who must receive the percept
      p.data = {
        :event => 'update-production',
        :producing => @production[:producing_terrains], 
        :wasting => @production[:wasted_terrains]
      }
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :clients => @production[:raw_players].map(&:id) }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        #:user_id => User.current.id,
        #:user_state => User.current.state,
        #:users => user_data,
        :producing_terrains => @production[:producing_terrains],
        :wasted_terrains => DataModel::Game.wasted_terrain_coords,
        :players => raw_players(@production[:raw_players]),
        :event => 'update-player'
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      @game_exists = DataModel::Game.set_current @parameters # done here because it needs to reload the game now and at every possible rollback

      unless @game_exists
        #name = @parameters[:game_name] ? @parameters[:game_name] : @parameters[:game_id]
        why_not_applicable.publish(:name => :game_named_not_exist, :message => I18n.t(:'action.game.named_not_exists', {:name => @parameters[:game_id]}), :recipients => [])
      else
        if(DataModel::Game.current.state != 'playing')
          why_not_applicable.publish(:name => :game_ended, :message => I18n.t(:'action.game.ended'), :recipients => [])
        end
      end
      return why_not_applicable.empty?
    end

  end

end
