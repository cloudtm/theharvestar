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

# This module contains the logic to manage the transport challenge.
# Each game has some challenges like social challenge e transport challenge
# where players compete to gain victory points.
# A player win the transport challenge if he place the major number of roads
# in the map (he become the transport leader).
# The transport leader can change during all the game.
# This challenge assigns 1 victory point to the player that gains it.
module Challenges::TransportChallenge
  
  # Updates the transport leadership.
  # Note that this mechanism pertain only the current player. No other players
  # in the game are considered to compute the transport leadership (the game
  # trace the current leader and its points).
  def compute_transport_challenge
    # get transport points from the current player
    transport_level = self.current.transport_level
    # return if the transport points don't exceed the threshold
    return false if transport_under_threshold?(transport_level)

    is_leader = false
    if not DataModel::Game.current.transport_leader
      # set the current player as transport leader if it has not yet
      # been assigned
      is_leader = true
    elsif most_transporter_player?(transport_level)
      # set the current player as transport leader if he has
      # more transport points than the current leader
      is_leader = true
    end

    # set the social leader
    set_transport_leader(transport_level) if is_leader
    return is_leader
  end

  # Check that the transport points amount is below the threshold
  # specified in the Game Options.
  def transport_under_threshold?(transport_level)
    transport_level <= GameOptions.options(DataModel::Game.current.format)[:transport_threshold]
  end

  # Returns true if the transport points are more than the transport leader points.
  def most_transporter_player?(transport_level)
    transport_level > DataModel::Game.current.transport_count
  end

  # Set the transport leader in the current game.
  def set_transport_leader(transport_level)
    DataModel::Game.current.update_transport_leader(DataModel::Player.current, transport_level)
  end
end
