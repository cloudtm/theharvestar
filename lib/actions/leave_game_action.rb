# This action allows an user to leave the game.
#
# === Accepted parameters
# Nothing.
#
# === Applicability
# * The user must be playing a game.
#
# === Trace
# Nothing.
#
# === Perception
# * Empty ({})
#
module Actions
  class LeaveGameAction < Madmass::Action::Action
    include Actions::PerceptionHelper
    action_states :end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      @leaved = {:channel => DataModel::Game.current.channel, :pid => DataModel::Player.current.id}
      User.leave
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      #Example
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:clients => [ User.current.id ]}) #who must receive the percept
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'manage-state',
        :games_list => DataModel::Game.games_list(:states => ['joining', 'armed'])
      )
      Madmass.current_perception << p

      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ @leaved.channel ]}) #who must receive the percept
      p.data =  {
        :event => 'summary-leaved',
        :pid => @leaved[:pid]
      }
      Madmass.current_perception << p
    end

  end

end
