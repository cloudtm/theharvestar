###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# TheHarvestar is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# TheHarvestar is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with TheHarvestar.  If not, see <http://www.gnu.org/licenses/>.
#
# Copyright (c) 2010-2013 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Largo Alfredo Oriani 12
# 00152 Rome, Italy
#
###############################################################################
###############################################################################

module Relational
  # This class represents the Social Research & Development Progress.
  # Using this progress the player gains a "boycott group" that fight the
  # eco crime and take out it from any terrain that hosts a player settlement.
  # The eco crime disappear from the game until a new 7 is rolled out by the production action.
  # The player score is incremented by one unit if he has played this progress more times than any
  # other player of the game. No increment will happens if the amount of social progress played is less
  # than the threshold specified in the Game Options (min_social_count).
  class SocialProgress < RedProgress

    # This progress is applicable only if a calamity (Eco Crime) has been occurred
    # in a terrain where the player picks up resources.
    #def applicable?
    #  Player.current.settlements.each do |settlement|
    #    return true if settlement.terrains.detect{|terrain| !terrain.calamity.nil? }
    #  end
    #  return false
    #end
    class << self
      def affect_score?
        return true
      end
    end

    def effect
      # set the social leader
      compute_social_leader    
      DataModel::Player.current.reload
    end

    private

    # Updates the social leadership.
    def compute_social_leader
      # get social points from the current player
      social_level = DataModel::Player.current.social_level
      # exit if social points don't exceed the threshold
      return if social_under_threshold?(social_level)
      is_leader = false
      if not DataModel::Game.current.social_leader
        # set the current player as social leader if it has not yet
        # been assigned
        is_leader = true
      elsif most_social_player?(social_level)
        # set the current player as social leader if he has
        # more social points than the current leader
        is_leader = true
      end
      
      # set the social leader
      set_social_leader(social_level) if is_leader
    end

    # Check that the social points amount is below the threshold
    # specified in the Game Options.
    def social_under_threshold?(social_level)
      social_level <= GameOptions.options(DataModel::Game.current.format)[:social_threshold]
    end

    # Returns true if the social points are more than the social leader points.
    def most_social_player?(social_score)
      social_score > DataModel::Game.current.social_count
    end

    # Set the social leader in the current game.
    def set_social_leader(social_score)
      DataModel::Game.current.update_social_leader(DataModel::Player.current, social_score)
    end
  end

end