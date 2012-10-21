# Settlements are infrastructures that can be build on vertexes of the hex map.
# Settlements can be upgraded to cities.
module Cloudtm
  class Settlement
    include CloudTm::Model
    
    # returns the vertex where the settlement is build
    def to_vertex
      Map::Hex::Vertex.new(terrains[0].to_hex, terrains[1].to_hex, terrains[2].to_hex )
    end

    # returns the settlements on the requested vertexes if any (that means that thos vertexes are occupied)
    def self.occupied vertexes, options ={}
      settlements = []
      DataModel::Game.current.settlements.each do |settlement|
        is_occupied = false
        # if player_id is specified skip settlements that don't belongs to the player
        continue if( options[:player_id] and (options[:player_id] != settlement.player.id) )
        vertexes.each do |vertex|
          if( (vertex.x == settlement.x) and (vertex.y == settlement.y) )
            settlements << settlement 
            next
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
        settlement.terrains = DataModel::Terrain.find_by_hexes(vertex.hexes)
        settlement.game = DataModel::Game.current
        settlement.player = DataModel::Player.current
        #      settlement.save

        DataModel::Player.current.addSettlements settlement
      end

      # Upgrades the settlement at placed at the vertex provided as input
      def upgrade vertex
        #check if any of these locations is occupied
        to_upgrade = find_by_coords_and_level(vertex, level).first
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
        return find_by_coords_and_level(vertex, level).any?
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

    private

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
      x = coord_x
      y = coord_y
    end
  end
end