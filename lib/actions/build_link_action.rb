# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class BuildLinkAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :target
    action_states :play

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    def process_params
      @parameters[:target] = Map::Hex::Edge.factory(@parameters[:target])
      map_stragegy = "Map::#{DataModel::Game.current.format_class}::HexMap".constantize
      if map_stragegy.blank_tiles?(@parameters[:target].hexes)
        raise Madmass::Errors::WrongInputError, "#{self.class.name}: target is in the sea!"
      end
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      if initial_placement?
        DataModel::Road.build @parameters[:target]
      elsif r_and_d_link?
        DataModel::Road.place! @parameters[:target]
      else
        DataModel::Road.build @parameters[:target]
        # Consume the resources 'cause in this situation Player has no initial links and no R&D links
        DataModel::Player.current.pay! options(:road_cost)
      end

      # Check the transport challenge
      @transport_leader_changed = DataModel::Player.compute_transport_challenge
      Score.update_score

      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      if @transport_leader_changed
        DataModel::Game.current.players.each do |player|
          player.increase_version
        end
      else
        DataModel::Player.current.increase_version
      end
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

      # Check if there is links available or R&D links to be placed.
      unless r_and_d_link?
        if DataModel::Player.depleted? :road
          why_not_applicable.publish(
            :name => :build_pieces_depleted,
            :key => 'action.build.pieces_depleted',
            :subs => {:type => 'link'},
            :level => 2,
            :recipients => [User.current.id]
          )
        end
      end

      # Check if the player has enough resources for building a new link or if he owns free links (initial links or R&D links)
      unless for_free?
        unless DataModel::Player.current.can_buy?  options :road_cost
          why_not_applicable.publish(
            :name => :build_no_resource,
            :key => 'action.build.no_resource',
            :subs => {:type => 'link'},
            :recipients => [User.current.id]
          )
        end
      end

      # Check if the target location is already occupied
      unless DataModel::Road.legal? @parameters[:target]
        why_not_applicable.publish(
          :name => :build_already_occupied,
          :key => 'action.build.already_occupied',
          :recipients => [User.current.id]
        )
      end

      # Check if the road is reachable
      unless DataModel::Road.reachable?(@parameters[:target])
        why_not_applicable.publish(
          :name => :link_not_connected,
          :key => 'action.link.not_connected',
          :level => 1,
          :recipients => [User.current.id]
        )
      end

      return why_not_applicable.empty?
    end

    private

    def initial_placement?
      @for_free ||= (DataModel::Player.current.initial_to_place(:road) > 0)
    end

    def r_and_d_link?
      @bonus_links ||= DataModel::Road.unplaced_roads_available?
    end

    def for_free?
      initial_placement? or r_and_d_link?
    end

  end

end
