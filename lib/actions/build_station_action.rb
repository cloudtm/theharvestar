# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class BuildStationAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :target
    action_states :play

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    def process_params
      @parameters[:target] = Map::Hex::Vertex.factory(@parameters[:target])
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # Build the city
      DataModel::Settlement.upgrade @parameters[:target]
      # consume the resources (unless we are in the initial placement phase)
      DataModel::Player.current.pay! options(:city_cost)
      # update the score
      Score.increase_score options(:settlement_score_increment)
      Score.update_score
      
      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      DataModel::Player.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :clients => [ User.current.id ] }) #who must receive the percept
      p.data = DataModel::Player.current.to_percept.merge(
        :event => 'update-player',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => [DataModel::Game.current.channel] }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :infrastructures => current_infrastructures,
        :event => 'update-game'
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?

      if DataModel::Player.depleted? :city
        why_not_applicable.publish(
          :name => :build_pieces_depleted, 
          :key => 'action.build.pieces_depleted',
          :subs => {:type => 'station'},
          :level => 1, 
          :recipients => [User.current.id]
        )
      end

      # Check if the player has enough resources for building a new link or if he owns free links (initial links or R&D links)
      unless DataModel::Player.current.can_buy?  options :city_cost
        why_not_applicable.publish(
          :name => :build_no_resource,
          :key => 'action.build.no_resource',
          :subs => {:type => 'station'},
          :recipients => [User.current.id]
        )
      end

      # Check if the target is a colony
      unless DataModel::Settlement.colony? @parameters[:target]
        why_not_applicable.publish(
          :name => :station_not_legal,
          :key => 'action.station.not_legal',
          :recipients => [User.current.id]
        )
      end

      return why_not_applicable.empty?
    end



  end

end
