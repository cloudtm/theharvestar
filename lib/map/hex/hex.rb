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

# We use the Hexmap Coordinate System described here (we use the other
# diagonal axis as x, not the column one):
# http://3dmdesign.com/development/hexmap-coordinates-the-easy-way
# A hex is a tile in a HexMap that is identifyied by two coordinates
class Map::Hex::Hex

  # attribute readers for the coordinates of the hex
  attr_reader :x, :y

  #Initializes the hex with its two coordinates
  def initialize x, y
    @x = x
    @y = y
  end

  #defines equality for hexes
  def eql? other
    @x.eql? other.x and @y.eql? other.y
  end

  #returns the hash of the hex
  def hash
    "#{@x},#{@y}".hash
  end

  #Returns a list of the geometrically neighbouring hexes
  def neighbors
    [Map::Hex::Hex.new(@x-1,@y+1),
      Map::Hex::Hex.new(@x+1,@y-1),
      Map::Hex::Hex.new(@x,@y+1),
      Map::Hex::Hex.new(@x+1,@y),
      Map::Hex::Hex.new(@x-1,@y),
      Map::Hex::Hex.new(@x,@y-1)]
  end

  # Returns the distance among this vertex and the given one.
  # ref: http://playtechs.blogspot.com/2007/04/hex-grids.html
  def dist other
    delta_x = other.x - @x
    delta_y = other.y - @y
    return (delta_x.abs + delta_y.abs + (delta_x + delta_y).abs) >> 1 # Bit shift right = /2
  end
end
