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

# Settlements are infrastructures that can be build on vertexes of the hex map.
# Settlements can be upgraded to cities.
module Cloudtm
  class Settlement
    include CloudTm::Model
    
    def attributes_to_hash
      {
        :id => id,
        :x => x,
        :y => y,
        :level => level
      }
    end

    # returns the vertex where the settlement is build
    def to_vertex
      terrains_ary = terrains.map(&:to_hex)
      Map::HexGrid::Vertex.new( terrains_ary[0], terrains_ary[1], terrains_ary[2] )
    end

    # returns the settlements on the requested vertexes if any (that means that thos vertexes are occupied)
    def self.occupied vertexes, options ={}
      settlements = []
      DataModel::Game.current.settlements.each do |settlement|
        is_occupied = false
        # if player_id is specified skip settlements that don't belongs to the player
        Rails.logger.debug "PLAYER IS: #{options[:player_id]} AND PLAYER IN SETTLEMENT IS: #{settlement.player.id}"
        next if( options[:player_id] and (options[:player_id] != settlement.player.id) )
        vertexes.each do |vertex|
          Rails.logger.debug "VERTEX: #{vertex.x}-#{vertex.y} - SETTLEMENT: #{settlement.x}-#{settlement.y}"
          if( (vertex.x == settlement.x) and (vertex.y == settlement.y) )
            settlements << settlement 
            #next
          end
        end  
      end
      settlements
    end

    class << self
      # Creates the desired construction and associates it to its player
      def build  vertex
        settlement = self.new
        settlement.level = 1
        DataModel::Terrain.find_by_hexes(vertex.hexes).each do |terrain|
          settlement.addTerrains terrain
        end
        settlement.generate_coords

        settlement.game = DataModel::Game.current
        settlement.player = DataModel::Player.current
        #DataModel::Player.current.addSettlements settlement
      end

      # Upgrades the settlement at placed at the vertex provided as input
      def upgrade vertex
        #check if any of these locations is occupied
        to_upgrade = find_by_coords_and_level(vertex, 1).first
        to_upgrade.update_attribute(:level, 2)
      end

      # Find the settlements of a specific level and coordinates 
      def find_by_coords_and_level(vertex, level)
        settlements = []
        DataModel::Player.current.settlements.each do |settlement|
          if( settlement.x == vertex.x and 
              settlement.y == vertex.y and 
              settlement.level == level and 
              DataModel::Game.current.id == settlement.game.id)
            settlements << settlement
          end
        end
        settlements
      end

      # This predicate returns true if the player "can reach", through his roads, the target.
      # It is implemented searching a non empty intersection between the edges starting from d
      # and the set of the edges that host a player road
      def reachable? vertex
        # one unique pairs per terrain
        player_roads = DataModel::Player.current.roads.map {|road| road.to_edge}
        target_roads = vertex.edges
        return (player_roads & target_roads).any?
      end


      # Checks if target is free and if placement respects distance rule, i.e.:
      # there are no colonies at neighboring vertexes.
      # Returns a distance:
      # 0: the location is already occupied
      # 1: there is a settlement at distance 1
      # 2: position is legal as other settlements are at distance 2 or more
      def distance vertex
        #generate target vertex
        vertexes = [vertex]
        #generate neighbors of target
        neighbors = vertex.neighbors
        vertexes += neighbors if neighbors
        #check if any of these locations is occupied

        near = occupied vertexes
        if(near.any?)
          dist = near.detect {|settlement| vertex.eql? settlement.to_vertex} ? 0 : 1
        else
          dist = 2
        end

        return dist
      end


      # Checks if target is a settlement of level 1 (i.e., a colony)
      # and that the current player owns it.
      def colony? vertex
        #check if any of these locations is occupied
        return find_by_coords_and_level(vertex, 1).any?
      end

      # Store associations between settlements and terrains.
      # Accept an array of settlements and another array of terrains (AR objects),
      # the last argument is an array of pair settlement/terrain ids representing
      # the join table used for many to many association.
      # Note that settlements and terrains array is used to increase efficiency,
      # all records needed can be loaded from db using the associations hash, but methods
      # that invoke this set_terrains already load all records before!
      def set_terrains(settlements, terrains, associations)
        associations.each do |settlement_terrain|
          settlement = settlements.detect{|settl| settl.id == settlement_terrain[:settlement_id]}
          settlement.addTerrains terrains.detect{|terrain| terrain.id == settlement_terrain[:terrain_id]}
        end
        settlements.each(&:generate_coords)
      end

    end

    #private

    # Generates a unique coordinate for the settlement
    # as the sum of the coordinates of the neighboring
    # terrains.
    def generate_coords
      coord_x = 0
      coord_y = 0
      terrains.each do |terrain|
        coord_x += terrain.x
        coord_y += terrain.y
      end
      self.x = coord_x
      self.y = coord_y
    end
  end
end