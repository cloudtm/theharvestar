# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class PlayAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_states :join
    next_state :play
    #choose_stats :init

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # TODO: FIXME!!!
      # This action changes the user state only for current user! We need to change
      # the state also for the other joined users so we do it here hacking in the user model.
      # Brain storm it differently in madmass :)
      DataModel::Game.current.players.each do |player|
        unless player == DataModel::Player.current
          # FIXME: move the user state in the Player with state_machine + action states
          player.user.update_attribute(:state, 'play')
        end
      end
      User.current.update_attribute(:state, 'play')
      #trace :current, :game
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => 'list' }) #who must receive the percept
      p.data = {
        :id => DataModel::Game.current.id,
        :event => 'game-started'
      }
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => DataModel::Game.current.channel }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :map => current_map,
        :market => current_market,
        :infrastructures => current_infrastructures,
        :players => [ DataModel::Player.current.to_percept ],
        :players_info => players_info,
        :event => 'manage-state'
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      if !DataModel::Game.current
        why_not_applicable.publish(
          :name => :game_not_exist, 
          #:message => I18n.t(:'action.game.not_exists'), 
          :key => 'action.game.not_exists',
          :recipients => [User.current.id]
        )
      elsif (!DataModel::Game.current.all_players_ready?)
        why_not_applicable.publish(
          :name => :game_not_all_ready, 
          #:message => I18n.t(:'action.game.not_exists'), 
          :key => 'action.game.not_exists',
          :recipients => [User.current.id])
      end

      return why_not_applicable.empty?
    end

  end

end
