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
require File.join(Rails.root, 'lib', 'map', 'hex_grid', 'hex')

module Cloudtm
  class Road
    include CloudTm::Model
    

    def attributes_to_hash
      {
        :id => id,
        :x => x,
        :y => y
      }
    end

    class << self
      # Checks if a target edge is reached either by an existing road  or by a settlement
      # of the current player
      def reachable? edge
        vertexes = edge.vertexes
        candidate_edges = []
        candidate_edges += vertexes[0].edges
        candidate_edges += vertexes[1].edges

        ##FIXME: do in one query!
        candidate_edges.each do |edge|
          player_roads = find_by_player_and_coords(edge.x, edge.y)
          return true if player_roads.any?
        end

        return connected_to_settlement?(edge)
      end

      # check if edge is not already occupied and connected to a settlement
      # this is the primary condition for the initial placement
      # TODO, just for initial placement each colony must not have more than one road.
      def connected_to_settlement? edge
        vertexes = edge.vertexes
        # check if edge is connected to a settlement
        return DataModel::Settlement.occupied(vertexes, :player_id => DataModel::Player.current.id).any?
      end

      # Checks if target edge is not already occupied
      def legal? edge
        return find_by_coords(edge.x, edge.y).nil?
      end

      # Find the roads owned by the current player in the current game that has specific coordinates.
      def find_by_player_and_coords(coord_x, coord_y)
        roads = []
        DataModel::Player.current.roads.each do |road|
          Rails.logger.debug "PLAYER ROAD: #{road.x}-#{road.y} WITH #{coord_x}-#{coord_y}"
          if( (DataModel::Game.current.id == road.game.id) and 
              (road.x == coord_x) and 
              (road.y == coord_y) )
            Rails.logger.debug "THE ROAD IS ASSOCIATED TO THE CURRENT GAME"
            roads << road
          end
        end
        roads
      end

      # Find the road in the current game that has specific coordinates.
      def find_by_coords(coord_x, coord_y)
        DataModel::Game.current.roads.each do |road|
          Rails.logger.debug "COMPARING ROAD #{road.x}-#{road.y} WITH #{coord_x}-#{coord_y}"
          if(road.x == coord_x and road.y == coord_y)
            return road
          end
        end 
        return nil
      end

      # This function builds a road and places it on a target edge. If no edge parameter is passed to the function,
      # an UNPLACED road will be created (e.g. if current player has performed a use progress action
      # on a transport progress previously bought)
      def build(edge = nil)
        road = self.new
        road.game = DataModel::Game.current
        #road.player = DataModel::Player.current
        
        if edge
          DataModel::Terrain.find_by_hexes(edge.hexes).each do |terrain|
            road.addTerrains terrain 
          end          
        end
        # This generate_coords is invoked in order to re-assign x and y attributes accordingly to the terrains just associated to road
        road.generate_coords
        DataModel::Player.current.addRoads road
        road
      end

      # Build a road and mark that is created from R&D progress (transport progress).
      def build_from_progress
        road = build
        road.update_attribute(:from_progress, true)
        road
      end

      # This function assigns the chosen edge as destination of any unplaced road of the current player.
      # If current player road set is already completely placed, no change on the db state is performed.
      def place! edge
        road = unplaced_roads.first
        if road
          road.addTerrains DataModel::Terrain.find_by_hexes(edge.hexes)

          # This generate_coords is invoked in order to re-assign x and y attributes accordingly to the terrains just associated to road
          generate_coords
        end
      end

      def unplaced_roads_available?
        unplaced_roads.any?
      end

      def unplaced_roads
        unplaced_roads_for_player(DataModel::Player.current)
      end

      def unplaced_roads_for_player(_player)
        _player.roads.each do |road|
          Rails.logger.debug "ROAD PLACED: #{road.inspect}"
        end
        _player.roads.select{|road| 
          (road.game.id == DataModel::Game.current.id) and (road.x == 0 or road.x.nil?) and (road.y == 0 or road.y.nil?)
        }        
      end

      # This method returns the subset of roads of the current game that are already placed
      # on the map (i.e. in the returned array it does not include any unplaced road (i.e. roads belonging to any
      # player who had bought and used a transport_progress))
      def roads_on_map
        map_roads = []
        DataModel::Game.current.roads.each do |road|
          map_roads << road if( road.x != 0 or road.y != 0)
        end
        map_roads
      end

      # Store associations between roads and terrains.
      # Accept an array of roads and another array of terrains,
      # the last argument is an array of pair road/terrain ids representing
      # the join table used for many to many association.
      # Note that roads and terrains array is used to increase efficiency,
      # all records needed can be loaded from db using the associations hash, but methods
      # that invoke this set_terrains already load all records before!
      def set_terrains(roads, terrains, associations)
        associations.each do |road_terrain|
          road = roads.detect{|rd| rd.id == road_terrain[:road_id]}
          road.addTerrains terrains.detect{|terrain| terrain.id == road_terrain[:terrain_id]}
        end
        
      end
    end

    #returns the edge representation of the current road
    def to_edge
      return nil if terrains.empty?
      ary_terrains = terrains.to_a
      Rails.logger.debug "ary_terrains #{ary_terrains.inspect}"
      t1 = ary_terrains[0]
      Rails.logger.debug "ary_terrains T1 #{t1.inspect}"
      t2 = ary_terrains[1]
      Rails.logger.debug "ary_terrains T2 #{t2.inspect}"
      Rails.logger.debug "MAP: #{Map::HexGrid::Hex}"
      h1 = t1.to_hex
      h2 = t2.to_hex
      Map::HexGrid::Edge.new(h1, h2)
    end

    #private

    # Generates a unique coordinate for the road
    # as the sum of the coordinates of the neighboring
    # terrains.
    # IMPORTANT DO NOT CHANGE X AND Y MANUALLY!!!
    def generate_coords
      coord_x=0
      coord_y=0
      terrains.each do |terrain|
        coord_x += terrain.x
        coord_y += terrain.y
      end
      self.x = coord_x
      self.y = coord_y
    end
  end
end