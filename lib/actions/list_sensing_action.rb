# This action lists all games. This is a sensing action.
#
# Should sort list based on:
#   1. Friends that joined the game (TODO)
#   2. Number of players missing for starting the game
#   3. List only pending games (not started and not full) (TODO)
#
# === Accepted parameters
# * text: full search text used to filter games (searched in game name and user names).
#
# === Applicability
# * The user can not list games while playing.
#
# === Trace
# Nothing.
#
# === Perception
# * All games.
#
module Actions
  class ListSensingAction < Madmass::Action::Action
    include Actions::PerceptionHelper


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      perc = Madmass::Perception::Percept.new(self)

      perc.add_headers({:topics => []}) #who must receive the percept
      game_percept = DataModel::Game.current ? DataModel::Game.current.to_percept : {}
      perc.data = {
        :sensing => game_percept.merge(
          :game_options => GameOptions.options(:base),
          :game_locales => GameLocales.get(['action', 'account', 'gui']),
          #:settings => %q( {"audio":{"volume":{"fx":100,"music":0}},"hiscores":{"size":10},"gui":{"presence":{"open":true,"entries":20}}} ),
          :playing_users => User.where(:state => [:play, :end]).map(&:id),
          :user_id => User.current.id,
          :user_state => 'list', #User.current.state,
          :users => user_data,
          :channel => 'list',
          :games_list => [], #DataModel::Game.games_list(:states => ['joining', 'armed'], :text => @parameters[:text]),
          :settings => User.current.settings
        )
      }

      Madmass.current_perception << perc
    end

  end

end