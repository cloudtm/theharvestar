# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class BuildOutpostAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :target
    action_states :play

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    def process_params
      @parameters[:target] = Map::Hex::Vertex.factory(@parameters[:target])
      map_stragegy = "Map::#{DataModel::Game.current.format_class}::HexMap".constantize
      unless map_stragegy.in_map?(@parameters[:target].hexes)
        raise Madmass::Errors::WrongInputError, "#{self.class.name}: target is out of the map!"
      end
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # Build the colony
      DataModel::Settlement.build @parameters[:target]
      #consume the resources (unless we are in the initial placement phase)
      DataModel::Player.current.pay! options(:colony_cost) unless initial_placement?
      DataModel::Player.current.init_resources @parameters[:target] if initial_placement?
      # update the score
      Score.increase_score options(:settlement_score_increment)
      Score.update_score
      
      # FIXME: chenge this
      # increment game version
      DataModel::Game.current.increase_version
      
      # FIXME: chenge this
      # change player version
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
      if DataModel::Player.depleted? :colony
        # msg = {:key => 'action.build.pieces_depleted', :subs => {:type => 'outpost'}, :level => 3}
        # not_applicable(msg);@message_builder.add_alert(msg)
        why_not_applicable.publish(
          :name => :build_pieces_depleted, 
          #:message => I18n.t(:'action.build.pieces_depleted', {:type => 'outpost'}), 
          :key => 'action.build.pieces_depleted',
          :subs => {:type => 'outpost'},
          :level => 3, 
          :recipients => [User.current.id]
        )
      end
      # initial placement ----------------------
      unless initial_placement?
        unless DataModel::Player.current.can_buy? options(:colony_cost)
          # msg = {:key => 'action.build.no_resource', :subs => {:type => 'outpost'}}
          # not_applicable(msg);@message_builder.add_alert(msg)
          why_not_applicable.publish(
            :name => :build_no_resource, 
            #:message => I18n.t(:'action.build.no_resource'),
            :key => 'action.build.no_resource',
            :subs => {:type => 'outpost'},
            :recipients => [User.current.id]
          )
        end
        unless DataModel::Settlement.reachable? @parameters[:target]
          # msg = {:key => 'action.outpost.not_connected', :level => 2}
          # not_applicable(msg);@message_builder.add_alert(msg)
          why_not_applicable.publish(
            :name => :outpost_not_connected, 
            #:message => I18n.t(:'action.outpost.not_connected'), 
            :key => 'action.outpost.not_connected',
            :subs => {:type => 'outpost'}, 
            :level => 2, 
            :recipients => [User.current.id]
          )
        end
      end
      # ----------------------------------------
      distance = DataModel::Settlement.distance @parameters[:target]
      if distance < 2
        if distance == 0
          # msg = {:key => 'action.build.already_occupied', :level => 1}
          why_not_applicable.publish(
            :name => :build_already_occupied, 
            #:message => I18n.t(:'action.build.already_occupied'), 
            :key => 'action.build.already_occupied',
            :recipients => [User.current.id]
          )
        elsif distance == 1
          why_not_applicable.publish(
            :name => :outpost_too_near, 
            #:message => I18n.t(:'action.outpost.too_near'), 
            :key => 'action.outpost.too_near',
            :recipients => [User.current.id]
          )
        end
      end

      return why_not_applicable.empty?
    end

    def initial_placement?
      @for_free ||= (DataModel::Player.current.initial_to_place(:settlement) > 0)
    end

  end

end
