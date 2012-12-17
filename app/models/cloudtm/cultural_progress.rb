module Cloudtm
  # This class represents the Cultural Research & Development Progress.
  # When player uses this type of progress his score will be increased of <cultural_score_increment> because
  # he has gifted a new cultural building to the community (i.e. a new building will appear in the middle
  # of a random chosen terrain)
  class CulturalProgress < RedProgress
    class << self
      def affect_score?
        return true
      end
    end

    def effect
      Score.increase_score GameOptions.options(DataModel::Game.current.format)[:cultural_score_increment]
      used!
    end
  end
end