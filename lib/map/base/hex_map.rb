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

# Represent a concentric hexagonal map with radius MAP_RADIUS.
class Map::Base::HexMap

  # Map radius. Central tile is radius 0, first ring is radius 1 and so on
  MAP_RADIUS = 3
  # Center of the map, used to generate rings
  ORIGIN_HEXAGON = Map::HexGrid::Hex.new(0,0)
  # x coordinates of the hex ring at radius 1. Used to generate all the other rings.
  RING_GENERATOR = [0,1,1,0,-1,-1] unless defined? RING_GENERATOR

  class << self

    # Returns true if all the hexagons are within the map
    def in_map?(hexes)
      hexes.each do |hex|
        return false if hex.dist(ORIGIN_HEXAGON) > MAP_RADIUS
      end
      return true
    end

    # Returns true if the hexagons are blank tiles
    def blank_tiles?(hexes)
      hexes.each do |hex|
        return false unless blank_tile? hex
      end
      return true
    end

    # Returns true if the hexagon is a blank tiles
    def blank_tile?(hex)
      hex.dist(ORIGIN_HEXAGON) >= MAP_RADIUS
    end

    #returns true if the coordinates are in the middle column of the map
    def middle_column?(hex)
      hex.x == -hex.y
    end

    # Returns hexagons belonging to the ring of the given radius
    def ring(radius)
      raise(GameErrors::GvisionError, "#{self.name}: there are no rings with negative radius!") if radius < 0
      return [Map::HexGrid::Hex.new(0,0)] if radius == 0
      hexes = []
      coords_x = ring_generator(radius)
      coords_x.each_index  do |i|
        hexes << Map::HexGrid::Hex.new(coords_x.at(i), coords_x.at((radius * 2 + i) % coords_x.length))
      end
      return hexes
    end

    # Returns the array of x coordinates for the hexagon ring of the given radius.
    # y coordinates are obtained from index [2*radius].
    def ring_generator(radius)
      generator = []
      generator_size = RING_GENERATOR.size
      generator_size.times do |gen|
        radius.times do |weight|
          generator << RING_GENERATOR[gen] * (radius - weight) + RING_GENERATOR[(gen + 1) % generator_size] * weight
        end
      end
      return generator
    end

  end

end

