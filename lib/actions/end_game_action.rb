# This action ends the game and returns the scores to all players.
#
# === Accepted parameters
# * nothing
#
# === Applicability
# * The game has a winner.
#
# === Trace
# * Current game
#
# === Perception
# * Game (with scores)
# * All player
#
module Actions
  class EndGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_states :play

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # This action changes the user state only for current user! We need to change
      # the state also for the other joined users so we do it here hacking in the user model.
      # Brain storm it differently in madmass :)
      DataModel::Game.current.players.each do |player|
        #unless player == DataModel::Player.current
          player.user.state = 'end'
          player.user.save!
        #end
      end

      # FIXME: chenge this
      # increment game version
      DataModel::Game.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ DataModel::Game.current.channel ]}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'manage-state',
        :summary => summary
      )
      Madmass.current_perception << p
    end

    def applicable?
      unless DataModel::Game.current.winner
        why_not_applicable.publish(
          :name => :game_cannot_end,
          :key => 'action.game.cannot_end'
        )
      end

      return why_not_applicable.empty?
    end

  end

end
