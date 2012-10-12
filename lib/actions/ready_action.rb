# This action toggles the ready state for the user when joined to a game.
#
# === Accepted parameters
# Nothing.
#
# === Applicability
# * The user must be joined to a game.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
# * Current player
module Actions
  class ReadyAction < Madmass::Action::Action
    extend ActiveModel::Translation

    action_params
    action_states :join

    # [OPTIONAL]  Add your initialization code here.
    # def initialize params
    #   super
    #  # My initialization code
    # end


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      toggled_ready = !DataModel::Player.ready?
      DataModel::Player.ready(toggled_ready)

      #trace :current, :game
      #trace :players, Game.current.fresh_players  #TODO:check if this is needed (we have already the model validation on uniqness of slot)

    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => DataModel::Game.current.channel}) #who must receive the percept

      user = User.current.to_hash([:id, :nickname, :state, :score])
      user[:player] = DataModel::Player.current.to_hash([:id, :avatar, :slot, :ready])
      p.data = DataModel::Game.current.to_percept.merge(
        # upadtes the state as it certainly changes on transitions
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => [user],
        :event => 'user-ready'
      )
      Madmass.current_perception << p
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      true
    end

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    # def process_params
    #   puts "Implement me!"
    # end

  end

end
