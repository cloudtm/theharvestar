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

# We use the Hexmap Coordinate System described here
# http://3dmdesign.com/development/hexmap-coordinates-the-easy-way
#An edge is defined as a pair of hexes
class Map::HexGrid::Edge
  # x and y coordinates in hexagon space.
  attr_reader  :x, :y

  # Use this factory method to instantiate an edge.
  # * coords: an array of four coordinates [x1,y1,x2,y2] that specifies 2 hexagons.
  #   Example: [0,0,1,0], where the first pair of cooridinates (0,0) defines the first hexagon and
  #   the second pair (1,0) defines the second hexagon.
  def self.factory coords
    valid? coords do |hex1, hex2|
      self.new hex1, hex2
    end
  end

  # Validates the four coordinates [x1,y1,x2,y2] that should specify the edge. It can be used in 2 ways:
  # * without specifying a block:  it will simply return the validation result in the form of true or false
  # * specifying a block: it will raise a Madmass::Errors::WrongInputError if the validation does not pass.
  # If you use a block, it will receive the 2 Hex objects that define the edge.
  def self.valid? coords
    error = nil
    result = false

    case
    when coords.nil?
      error = "#{self.name}: you are trying to create an edge with nil coordinates!"
    when coords.size != 4
      error = "#{self.name}: wrong number of coords, should be 4 but are #{coords.size}"
    end

    if(error.blank?)
      h1 = Map::HexGrid::Hex.new(coords[0], coords[1])
      h2 = Map::HexGrid::Hex.new(coords[2], coords[3])

      if(h1.dist(h2) == 1)
        result = block_given? ? yield(h1,h2) : true
      else
        error = "#{self.name}: the coordinates do not define a valid edge!"
      end

    end
    raise Madmass::Errors::WrongInputError, error if(block_given? and !error.blank?)
    return result
  end

  # Returns the array of four coordinates [x1,y1,x2,y2]. Each coordinate pair defines one hexagon.
  def coords
    [@hex1.x, @hex1.y,
      @hex2.x, @hex2.y]
  end


  # Returns the 2 Hexagon that define this edge.
  def hexes
    [@hex1, @hex2]
  end

  # Verifies if 2 edges are the same one.
  # * other is the Edge to compare.
  # Returns true if the 2 edges are the same one, false otherwise.
  def eql? other
    @x == other.x and @y == other.y
  end

  # Returns an unique hash (String) of this edge. It is coordinate based, so each Edge instance
  # that represent the same geometric edge will return the same hash.
  def hash
    "#{@x},#{@y}".hash
  end

  # Returns the 2 Vertex of this edge.
  def vertexes
    result = []
    nodes = @hex1.neighbors & @hex2.neighbors
    result << Map::HexGrid::Vertex.new(@hex1, @hex2, nodes[0])
    result << Map::HexGrid::Vertex.new(@hex1, @hex2, nodes[1])
    return result
  end

  private

  # Edge constructor is private. The only way to create one is to use the above factory.
  # The factory checks the validitiy of the input data.
  def initialize hex1, hex2
    @hex1 = hex1
    @hex2 = hex2
    @x =@hex1.x+@hex2.x
    @y =@hex1.y+@hex2.y
  end
  
end
