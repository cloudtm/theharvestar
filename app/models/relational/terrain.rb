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

# Terrains are entities placed on hexes. Terrains are placed on hexes and have a
# production probability and a type
module Relational
  class Terrain < ActiveRecord::Base

    # can mass assign some attributes
    attr_accessible :x, :y, :production_probability, :terrain_type, :game_id

    enum_field :terrain_type, GameOptions.options(:base)[:terrain_types].keys

    belongs_to :game
    has_and_belongs_to_many :settlements
    has_and_belongs_to_many :roads
    #has_one :calamity

    validates_uniqueness_of :game_id, :scope => [:x, :y]

    # returns the terrain type as a symbol
    def terrain_type
      read_attribute(:terrain_type).to_sym
    end

    # sets the terrain type
    def terrain_type=(value)
      write_attribute(:terrain_type, value.to_s)
    end

    def terrain_label
      GameOptions.options(Game.current.format)[:terrain_labels][terrain_type]
    end

    # Converts the Terrain to a geometrical object,
    # namely a hexagon of a hex grid
    def to_hex
      Map::HexGrid::Hex.new(x,y)
    end

    class << self

      # provided a dice roll, identifyies producing terrains in the current game and
      # updates the players' resources.
      # This method is called by the background job (and by no other) to produce resources
      def produce options
        result = {}

        #retrieve terrains that will produce
        producing_terrains = where(:game_id => DataModel::Game.current.id, :production_probability => options[:roll])
        not_wasted_terrains = producing_terrains - DataModel::Game.wasted_terrains
        result[:producing_terrains] = producing_terrains.map {|terrain| [terrain.x, terrain.y]}
        #update resources of players
        #result[:players] = []
        result[:raw_players] = []
        productions(not_wasted_terrains).each do |player_id, resources|
          #Player.update_counters(player_id, resources)
          player = DataModel::Player.where(:id => player_id).first # The query also pick ups the newly updated values by the previous update_counters
          player.update_resources(resources)
          result[:raw_players] << player
          #result[:players] << player.to_percept
        end
        DataModel::Game.current.reload
        return result
      end

      # returns a hash with this structure: {:wasted_terrain => [[x1,y1],[x2,y2]...]}
      # each couple xk,yk identifies a terrain that has become unproductive because it's currently controlled by robber.
      # The unproductive terrain set is created using a random distribution
      def waste_terrains(params)
        result = {}
        if(params[:wasted_terrains])
          result[:wasted_terrains] = params[:wasted_terrains]
          params[:wasted_terrains].each do |wasted|
            terrain = where(:game_id => DataModel::Game.current.id, :x => wasted[0], :y => wasted[1]).first
            #DataModel::Calamity.happens terrain
          end
        else
          result[:wasted_terrains] = []
          # asks DB all the terrains that can host the robber
          target_terrain_type = (1..6).map{|i| "terrain_"+i.to_s}
          target_terrains = (where(:game_id => DataModel::Game.current.id,:terrain_type => target_terrain_type))
          # selects randomically the target_terrain subset that will be host
          wasted_terrains_size = GameOptions.options(DataModel::Game.current.format)[:wasted_amount]
          wasted_terrains_indexes = wasted_terrains_size.times.map{rand target_terrains.size}
          wasted_terrains_indexes.uniq!
          #collects all the information in the result hash
          wasted_terrains_indexes.each do |index|
            result[:wasted_terrains] << [target_terrains[index].x, target_terrains[index].y]
            #DataModel::Calamity.happens target_terrains[index]
          end
        end
        result
      end


      #returns the resources to be added to players when producing_terrains produce
      #In detail: returned value is a hash containing an entry for each player whose resources have to be incremented.
      #Each player entry follows this pattern: player_id => <resource_increment_hash>.
      #Each resource_hash entry  follows instead this pattern:  :resource_type => increment.
      #E.g. {1 => {:grain => 1},14 => {:grain =>2,:ore=>1}}
      def productions producing_terrains
        production = {}
        producing_terrains.each do |t|
          t.settlements.each do |s|
            production[s.player_id] ||= {}
            resource_type = GameOptions.options(DataModel::Game.current.format)[t.terrain_type]
            production[s.player_id][resource_type] ||= 0
            production[s.player_id][resource_type] += 1*s.level; #FIXME depends on settlement_type
          end
        end

        return production
      end

      #Returns an array of Terrains
      def find_by_hexes hexes
        query = []
        hash = {}
        hexes.each_with_index do |h, idx|
          query << "(x = :x#{idx} and y = :y#{idx})"
          hash[:"x#{idx}"] =h.x
          hash[:"y#{idx}"] =h.y
        end

        where_query = "game_id = :game and "
        where_query += "(#{query.join(" or ")})"

        return where(where_query, {:game => DataModel::Game.current.id}.merge(hash) )
      end

    end


  end
end