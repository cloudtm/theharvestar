# This action creates a new game.
#
# === Accepted parameters
# * *format*: Game format
# * *name*: Game name
#
# === Applicability
# * The user who wants to create the game must not be already playing another game.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
#
module Actions
  class CreateGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_params :name, :format, :terrains
    action_states :list
    next_state :join

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      DataModel::Game.factory @parameters
      User.join DataModel::Game.current.id
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => ['list']}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'join-game'
      )
      Madmass.current_perception << p
    end

  end

end
