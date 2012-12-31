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
  class Road < ActiveRecord::Base
    belongs_to :player
    belongs_to :game
    has_and_belongs_to_many :terrains

    before_save :generate_coords

    class << self
      # Checks if a target edge is reached either by an existing road  or by a settlement
      # of the current player
      def reachable? edge
        vertexes = edge.vertexes
        candidate_edges = []
        candidate_edges += vertexes[0].edges
        candidate_edges += vertexes[1].edges

        ##FIXME: do in one query!
        candidate_edges.each do |e|
          return true if where(:game_id => DataModel::Game.current.id,
                                    :x => e.x, :y => e.y,
                                    :player_id => DataModel::Player.current.id).any?
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
        return where(:game_id => DataModel::Game.current.id, :x => edge.x, :y => edge.y).empty?
      end

      # This function builds a road and places it on a target edge. If no edge parameter is passed to the function,
      # an UNPLACED road will be created (e.g. if current player has performed a use progress action
      # on a transport progress previously bought)
      def build(edge = nil)
        road = self.new
        road.game = DataModel::Game.current
        road.player = DataModel::Player.current
        road.terrains = DataModel::Terrain.find_by_hexes(edge.hexes) if edge
        DataModel::Player.current.roads << road
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
        road = where(:game_id => DataModel::Game.current.id,:player_id => DataModel::Player.current.id, :x => 0, :y=> 0).first
        unless road.nil?
          road.terrains = DataModel::Terrain.find_by_hexes(edge.hexes)
          road.save #This save is invoked in order to re-assign x and y attributes accordingly to the terrains just associated to road
        end
      end

      # Return unplaced roads (x and y are 0) for the current player (in the current game).
      def unplaced
        where(:game_id => DataModel::Game.current.id,:player_id => DataModel::Player.current.id, :x => 0, :y=> 0)
      end

      def unplaced_roads_available?
        unplaced.any?
      end

      # This method returns the subset of roads of the current game that are already placed
      # on the map (i.e. in the returned array it does not include any unplaced road (i.e. roads belonging to any
      # player who had bought and used a transport_progress))
      def roads_on_map
        where("game_id = ? and (x <> 0 or y <> 0)", DataModel::Game.current.id).all
      end

      # Store associations between roads and terrains.
      # Accept an array of roads and another array of terrains (AR objects),
      # the last argument is an array of pair road/terrain ids representing
      # the join table used for many to many association.
      # Note that roads and terrains array is used to increase efficiency,
      # all records needed can be loaded from db using the associations hash, but methods
      # that invoke this set_terrains already load all records before!
      def set_terrains(roads, terrains, associations)
        associations.each do |road_terrain|
          road = roads.detect{|rd| rd.id == road_terrain[:road_id]}
          road.terrains << terrains.detect{|terrain| terrain.id == road_terrain[:terrain_id]}
        end
        roads.each(&:save)
      end
    end

    #returns the edge representation of the current road
    def to_edge
      return nil if terrains.empty?
      Map::Hex::Edge.new(terrains.first.to_hex, terrains.last.to_hex)
    end

    private

    # Generates a unique coordinate for the road
    # as the sum of the coordinates of the neighboring
    # terrains.
    # IMPORTANT DO NOT CHANGE X AND Y MANUALLY!!!
    def generate_coords
      x=0
      y=0
      terrains.each do |terrain|
        x += terrain.x
        y += terrain.y
      end

      # FIXME: Senza il write attribute non vengono salvate... perchè?
      write_attribute(:x, x)
      write_attribute(:y, y)
    end
  end
end