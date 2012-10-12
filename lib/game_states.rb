# Patch for the state_machine gem. When the object that use the state machine is created
# the gem sets the state attribute with the initial value (in the constructor). This cause
# the "jruby RuntimeError: Java wrapper with no contents" error. 
# We open the gem class Machine and redefine the initialize_state method to prevent 
# this error (we set the initial state value manually). 
module StateMachine
  class Machine
    # Initializes the state on the given object.  Initial values are only set if
    # the machine's attribute hasn't been previously initialized.
    #
    # Configuration options:
    # * <tt>:force</tt> - Whether to initialize the state regardless of its
    #   current value
    # * <tt>:to</tt> - A hash to set the initial value in instead of writing
    #   directly to the object
    def initialize_state(object, options = {})
      state = initial_state(object)
      if state && (options[:force] || initialize_state?(object))
        value = state.value

        if hash = options[:to]
          hash[attribute.to_s] = value
        else
          # this is our change, the method must not set the state
          #write(object, :state, value)
        end
      end
    end

  end
end

module GameStates

  def self.included klass
    klass.class_eval do
      extend ClassMethods
      include InstanceMethods
      set_state_machine
    end
  end

  # This module injects instance methods only in the GameStates module (these methods are not
  # visible to the model)
  module InstanceMethods

    # Returns true if the game has enough players to start.
    def enough_player?
      players.size >= GameOptions.options(format)[:min_player_limit]
    end

    # Returns true if the game has just one player (he can start the demo).
    def one_player?
      players.size == 1
    end

    # Returns true if all players joined to the game are ready to start.
    def all_players_ready?
      true
      #any_unready = players.detect {|player| !player.ready}
      #return (any_unready ? false : true)
    end

    # Returns the player id of the winner if any, otherwise returns false
    def winner_player
      true
      #return (not winner.nil?)
    end

    # Resets the ready state for all players in the game
    def reset_ready_for_players
      players.each do |player|
        player.update_attribute(:ready, false)
      end
    end

  end

  module ClassMethods

    def initial_state
      'joining'
    end

    def set_state_machine

      # use state_machine gem to define events, transitions and states
      state_machine :initial => :joining do


        # fired in the JoinGameAction when players join the game
        event :fire_join do
          transition :joining => :armed, :if => lambda { |game| game.enough_player? }
        end

        # fired in the DemoGameAction when a player starts the demo match
        event :demo do
          transition :joining => :playing, :if => lambda { |game| game.one_player? }
        end

        after_transition :armed => :joining, :do => :reset_ready_for_players

        # fired in the LeaveGameAction when a player leave the game
        event :leave do
          transition :armed => :joining, :unless => lambda { |game| game.enough_player? }
        end

        # fired in the ReadyAction when a player is ready to start the match
        event :ready do
          transition :armed => :playing, :if => lambda { |game| game.all_players_ready? }
        end

        # fired in all actions, that can increment the score, executed by the players during the match
        # (i.e. BuildRoadAction, BuildLinkAction, etc.)
        event :score_changed do
          transition :playing => :ended, :if => lambda { |game| game.winner_player }
        end

      end

    end

  end

end
