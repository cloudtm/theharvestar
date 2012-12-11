module Relational
  # Research and Development Progress.
  # This is the super class for all Research and Development Progressess in the game.
  # A R&D Progress can be bought by users paying its specific cost (specified in the Game Options yaml file: development_cost).
  # Each R&D Progress has its own effect that is implemented in the sub-classes that specialize it.
  # The player can't choose the type of progress by himself. When the player buys a progress the game selects the type depending
  # on a probability distribution defined in the Game Options (development_probability).
  class RedProgress < ActiveRecord::Base

    belongs_to :player

    class << self
      # Factory method.
      # This factory uses the probability distribution defined in the Game Options
      # to select the progress sub-class to instantiate.
      def factory(progress = nil)
        if(progress)
          progress_class = "DataModel::#{progress}".constantize
        else
          # distribution is an array representing the distribution of the progresses selectable by the current player
          # eg [:social, :recycling, :cultural, :recycling,:social...]
          distribution =  self.probability_distribution
          roll = Dice.roll(distribution.size) - 1
          ptype = distribution[roll].to_s
          # instantiate the model class
          progress_class = "DataModel::#{ptype.camelize}Progress".constantize
          # create the record in the db and return it
        end
        progress_class.create
      end

      def probability_distribution
        # calculate the distribution array
        prob = GameOptions.options(DataModel::Game.current.format)[:development_probability]
        #selects only the progresses "selectable" by the player
        available_progresses = prob.keys.select{|k| ("DataModel::#{k.to_s.camelize}Progress".constantize).selectable?}
        expansion = []
        available_progresses.each {|progress| prob[progress].times{expansion << progress} }
        expansion.shuffle
      end

       def selectable?
          true
       end

       def affect_score?
        false
       end

    end

    

    def name
      self.type.sub('Progress', '').underscore
    end

    # The Research and Development Progress cost (hash) is the same for every Progress type.
    def cost
      # read from game options.
      GameOptions.options(DataModel::Game.current.fotmat)[:development_cost]
    end

    # This method contains the precondition logic to the effect execution of the progress.
    #def applicable?
    #   true
    #end

    # It applies the side effects fired by using the progress.
    # All progress sub-classes must implement it.
    def effect
      raise "RedProgress is abstract!"
    end

    # Mark this progress as used. Note: players can't reuse progresses!
    def used!
      update_attribute(:used, true)
    end

    # In RedProgress subclasses this method can be redefined in order to assert if current player
    # can obtain, in the current state, a certain red_progress
   

    
  end

end