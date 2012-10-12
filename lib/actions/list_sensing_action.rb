# This file is the implementation of the  ListSensingAction.
# The implementation must comply with the action definition pattern
# that is briefly described in the Madmass::Action::Action class.

module Actions
  class ListSensingAction < Madmass::Action::Action
    #action_params :message
    #action_states :none
    #next_state :none

    # [OPTIONAL]  Add your initialization code here.
    # def initialize params
    #   super
    #  # My initialization code
    # end


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute

    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      perc = Madmass::Perception::Percept.new(self)

      perc.add_headers({:topics => []}) #who must receive the percept
      user = User.current.to_hash([:id, :nickname, :state, :score])
      user[:player] = DataModel::Player.current.to_hash([:id, :avatar, :slot, :ready])
      game_percept = DataModel::Game.current ? DataModel::Game.current.to_percept : {}
      perc.data = {
        :sensing => game_percept.merge(
          :game_options => GameOptions.options(:base),
          :game_locales => GameLocales.get(['action', 'account', 'gui']),
          #:settings => %q( {"audio":{"volume":{"fx":100,"music":0}},"hiscores":{"size":10},"gui":{"presence":{"open":true,"entries":20}}} ),
          :playing_users => User.where(:state => [:play, :end]).map(&:id),
          :user_id => User.current.id,
          :user_state => 'list', #User.current.state,
          :users => [user],
          :channel => 'list',
          :games_list => DataModel::Game.games_list(:states => ['joining', 'armed'], :text => @parameters[:text]),
          :settings => User.current.settings
        )
      }

      Madmass.current_perception << perc
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    # def applicable?
    #
    #   if CONDITION
    #     why_not_applicable.add(:'DESCR_SYMB', 'EXPLANATION')
    #   end
    #
    #   return why_not_applicable.empty?
    # end

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    # def process_params
    #   puts "Implement me!"
    # end

  end

end