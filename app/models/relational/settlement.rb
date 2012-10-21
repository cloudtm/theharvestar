# Settlements are infrastructures that can be build on vertexes of the hex map.
# Settlements can be upgraded to cities.
module Relational
  class Settlement < ActiveRecord::Base
    belongs_to :player
    belongs_to :game

    has_and_belongs_to_many :terrains
    before_save :generate_coords

    #returns the vertex where the settlement is build
    def to_vertex
      Map::Hex::Vertex.new(terrains[0].to_hex, terrains[1].to_hex, terrains[2].to_hex )
    end

    #returns the settlements on the requested vertexes if any (that means that thos vertexes are occupied)
    def self.occupied vertexes, options ={}
      query = []
      hash = {}
      vertexes.each_with_index do |v, idx|
        query << "(x = :x#{idx} and y = :y#{idx})"
        hash[:"x#{idx}"] =v.x
        hash[:"y#{idx}"] =v.y
      end

      where_query = "game_id = :game and "
      ##FIXME the following line is not safe, there could be SQL injection attacks!
      where_query += "player_id = #{options[:player_id]} and " if options[:player_id]
      where_query += "(#{query.join(" or ")})"

      return self.where(where_query, {:game => Game.current.id}.merge(hash))
    end

    class << self
      #Creates the desired construction and associates it to its player
      def build  vertex
        settlement = self.new
        settlement.level = 1
        settlement.terrains = DataModel::Terrain.find_by_hexes(vertex.hexes)
        settlement.game = DataModel::Game.current
        settlement.player = DataModel::Player.current
        #      settlement.save

        DataModel::Player.current.settlements << settlement
      end

      #upgrades the settlement at placed at the vertex provided as input
      def upgrade vertex
        #check if any of these locations is occupied
        to_upgrade = where(:game_id => DataModel::Game.current.id,
                           :x => vertex.x,
                           :y => vertex.y,
                           :level => 1).first
        to_upgrade.update_attribute(:level, 2)
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
        return where(:game_id => DataModel::Game.current.id,
                     :player_id => DataModel::Player.current.id,
                     :x => vertex.x,
                     :y => vertex.y,
                     :level => 1).any?
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
          settlement.terrains << terrains.detect{|terrain| terrain.id == settlement_terrain[:terrain_id]}
        end
        settlements.each(&:save)
      end

    end

    private

    # Generates a unique coordinate for the settlement
    # as the sum of the coordinates of the neighboring
    # terrains.
    # #IMPORTANT DO NOT CHANGE X AND Y MANUALLY!!!
    def generate_coords
      x=0
      y=0
      terrains.each do |terrain|
        x += terrain.x
        y += terrain.y
      end
      # Senza il write attribute non vengono salvate... perchè?
      write_attribute(:x, x)
      write_attribute(:y, y)
    end
  end
end