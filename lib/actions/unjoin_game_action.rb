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
module Actions
  class UnjoinGameAction < Madmass::Action::Action
    action_states :join
    next_state :list


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      # FIXME: change this
      # increment game and players version
      DataModel::Game.current.increase_version if DataModel::Game.current
      @game_zombie = User.leave
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      # first perception to sender only
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({:topics => [ 'list' ]})
      p.data = {
        :user_id => User.current.id,
        :user_state => User.current.state,
        # TODO: check if channel is in use in the client
        :channel => 'list',
        :event => 'unjoin-game'
      }
      p.data.merge!(@game_zombie) if @game_zombie
      Madmass.current_perception << p
    end

  end

end
