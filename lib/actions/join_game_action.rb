# This action joins the user to a game.
#
# === Accepted parameters
# * game_id: game id to join, or...
# * game_name: ... game name to join.
#
# This allows you to specify the game to join by id or by name.
#
# === Applicability
# * The game to join must exist.
# * The game must not be full.
# * The user can not join the same game he is already playing.
# * The user can play only one game at the time.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
# * All players
module Actions
  class JoinGameAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :game_id, :slot
    action_states :list
    next_state :join

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      @parameters[:game_id] = DataModel::Game.current.id unless @parameters[:game_id]
      User.join @parameters[:game_id], @parameters[:slot]

      #trace :current, :game
      #trace :players, Game.current.fresh_players  #TODO:check if this is needed (we have already the model validation on uniqness of slot)

    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => ['list'] }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'join-game'
      )
      Madmass.current_perception << p
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      # rollback proof assignment
      @already_joined = User.joined? if DataModel::Game.set_current(@parameters)
      unless DataModel::Game.current and ['joining', 'armed'].include? DataModel::Game.current.state
        why_not_applicable.publish(
          :name => :game_not_exist, 
          #:message => I18n.t(:'action.game.not_exists'), 
          :key => 'action.game.not_exists',
          :recipients => [User.current.id]
        )
      else if not @already_joined and DataModel::Game.current.full? @parameters[:game_id]
             why_not_applicable.publish(
              :name => :game_full, 
              #:message => I18n.t(:'action.game.full'), 
              :key => 'action.game.full',
              :recipients => [User.current.id]
            )
           end
      end

      if DataModel::Game.current and DataModel::Game.current.players.detect{|player| player.slot == @parameters[:slot].to_i}
        why_not_applicable.publish(
          :name => :slot_taken, 
          #:message => I18n.t(:'action.game.slot_taken'), 
          :key => 'action.game.slot_taken',
          :recipients => [User.current.id]
        )
      end

      return why_not_applicable.empty?
    end

  end

end
