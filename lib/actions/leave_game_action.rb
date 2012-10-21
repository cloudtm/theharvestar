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
    next_state :list


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      User.leave
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      # first perception to sender only
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:clients => [ User.current.id ]})
      p.data =  DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'manage-state',
        :games_list => DataModel::Game.games_list(:states => ['joining', 'armed'], :text => @parameters[:text])
      )
      Madmass.current_perception << p

      # second perception to notify all others
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => DataModel::Game.current.channel})
      p.data =  {
        :event => 'summary-leaved',
        :pid => DataModel::Player.current.id
      }
      Madmass.current_perception << p
    end

  end

end
