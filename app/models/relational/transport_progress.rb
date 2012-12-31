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
  # This class represents the Transport Research & Development Progress.
  # If the player uses this development progress gains N (amount specified in Game Options: transport_amount)
  # railway (class Road) that can be placed without paying when he prefers.
  class TransportProgress < RedProgress

    #def applicable?
    # options = GameOptions.options(Game.current.format)
    # @transport_amount = (Player.current.roads.size + options[:transport_amount] <= options[:max_roads]) ? options[:transport_amount] : (options[:max_roads] - Player.current.roads.size)
    # @transport_amount > 0
    #end

    def effect
      options = GameOptions.options(DataModel::Game.current.format)
      @transport_amount = (DataModel::Player.current.roads.count + options[:transport_amount] <= options[:max_roads]) ? options[:transport_amount] : (options[:max_roads] - DataModel::Player.current.roads.count)
      @transport_amount.times{ DataModel::Road.build_from_progress }
      used!
    end

    class << self
      def selectable?
        !DataModel::Player.depleted?(:road)
      end
    end

  end
end