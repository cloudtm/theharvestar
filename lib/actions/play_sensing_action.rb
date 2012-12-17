# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class PlaySensingAction < Madmass::Action::Action
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
          :map => current_map,
          :infrastructures => current_infrastructures,
          :players_info => players_info,
          :market => current_market,
          :game_options => GameOptions.options(:base),
          :game_locales => GameLocales.get(['action', 'account', 'gui']),
          :settings => User.current.settings,
          :user_id => User.current.id,
          :user_state => User.current.state,
          :playing_users => users_in_states([:play, :end]),
          :players => [ DataModel::Player.current.to_percept ],
          :channel => DataModel::Game.current.channel,
          :event => 'manage-state'
        )
      }

      Madmass.current_perception << perc
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      unless DataModel::Game.current
        why_not_applicable.publish(
          :name => :game_not_exist, 
          :key => 'action.game.not_exists',
          :recipients => []
        )
      end
      return why_not_applicable.empty?
    end

  end

end