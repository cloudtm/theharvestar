module Cloudtm
  class Road
    include CloudTm::Model
    
    #before_save :generate_coords

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
          if( (DataModel::Game.current.id == road.game.id) and 
              (road.x == coord_x) and 
              (road.y == coord_y) )
            roads << road
          end
        end
        roads
      end

      # Find the road in the current game that has specific coordinates.
      def find_by_coords(coord_x, coord_y)
        DataModel::Game.current.roads.each do |road|
          if(road.x == coord_x and road.y == coord_y)
            return road
          end
        end 
        return nil
      end

      # This function builds a road and places it on a target edge. If no edge parameter is passed to the function,
      # an UNPLACED road will be created (e.g. if current player has performed a use progress action
      # on a transport progress previously bought)
      def build (edge = nil)
        road = self.new
        road.game = DataModel::Game.current
        road.player = DataModel::Player.current
        road.addTerrains DataModel::Terrain.find_by_hexes(edge.hexes) if edge
        DataModel::Player.current.addRoads road
      end

      # This function assigns the chosen edge as destination of any unplaced road of the current player.
      # If current player road set is already completely placed, no change on the db state is performed.
      def place! edge
        road = unplaced_roads.first
        if road
          road.addTerrains DataModel::Terrain.find_by_hexes(edge.hexes)

          #road.save 
          #This save is invoked in order to re-assign x and y attributes accordingly to the terrains just associated to road
          generate_coords
        end
      end

      def unplaced_roads_available?
        unplaced_roads.any?
      end

      def unplaced_roads
        _unplaced_roads = []
        DataModel::Player.current.roads.each do |road|
          _unplaced_roads << road if(road.game.id == DataModel::Game.current.id and road.x == 0 and road.y == 0)
        end        
        _unplaced_roads
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
      Map::Hex::Edge.new(terrains.first.to_hex, terrains.last.to_hex)
    end

    private

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
      x = coord_x
      y = coord_y
    end
  end
end