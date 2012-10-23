module Actions
  module PerceptionHelper

    def user_data
      data = User.current.to_hash([:id, :nickname, :state, :score])
      data[:player] = DataModel::Player.current.to_hash([:id, :avatar, :slot, :ready])
      return [ data ]
    end

    # Collects all the needed information to start the game on client side: terrains, vertices
    # where the player can place a colony and edges where the player can build roads. There is no
    # constrain to map topology.
    #
    # Returns a hash of terrains, vertices and edges.
    #
    # A terrain is represented by hex coordinates where each vertex is an array of 6 coordinates,
    # 2 coordinates for each terrain around the vertex. Example:
    #
    # <tt>[0,0,1,0,1,-1]</tt> and it points to the terrains <tt>(0,0)</tt>, <tt>(1,0)</tt> and <tt>(1,-1)</tt>
    #
    # and each edge is an array of 4 coordinates, 2 coordinates for each terrain that shares the
    # same edge. Example:
    #
    # <tt>[0,0,1,0]</tt> and it points to the terrains <tt>(0,0)</tt> and <tt>(1,0)</tt>
    def current_map
      unique_vertices = {}
      unique_edges = {}
      terrains_info = []
      ring = Map::Base::HexMap.ring_generator(1);

      DataModel::Game.current.terrains.each do |terrain|
        terrains_info << [
          terrain.x,
          terrain.y,
          terrain.terrain_label,
          terrain.production_probability
        ]
        #      next unless terrain.production_probability > 0
        next if terrain.terrain_type == :blank

        baseX = terrain.x
        baseY = terrain.y

        ring.each_index do |i| #photon is just the index in the HEX_WAVE array ^_^
          vertex = [
            baseX, baseY,
            baseX + ring[i], baseY + ring[(i + 2) % ring.size],
            baseX + ring[(i + 1) % ring.size], baseY + ring[(i + 3) % ring.size]
          ]
          edge = [ baseX, baseY, vertex[2], vertex[3] ]

          realEdge = [vertex[0] + vertex[2], vertex[1] + vertex[3]]
          realVertex = [realEdge[0] + vertex[4], realEdge[1] + vertex[5]]

          edgeHash = realEdge.join(',') # Some function that generates an unique hash of the realEdge
          unique_edges[edgeHash] = edge unless unique_edges[edgeHash]

          vertexHash = realVertex.join(',') # Some function that generates an unique hash of the realVertex
          unique_vertices[vertexHash] = vertex unless unique_vertices[vertexHash]
        end
      end
      #add_to_check :terrains => terrains_info

      return {
        :terrains => terrains_info,
        :vertices => unique_vertices.values,
        :edges => unique_edges.values
      }
    end

    # Build a hash containing all the infrastructures of this game.
    #
    # <tt>{s: [settlements], r: [roads]}</tt>
    #
    # where *s* is an array of settlements and *r* is an array of roads.
    # * each settlement is a hash => <tt>{c: [x1,y1,x2,y2,x3,y3], l: level, p: player}</tt>
    # * each road is a hash => <tt>{c: [x1,y1,x2,y2], l: level, p: player}</tt>
    # * c are the coordinates
    # * level is the building level:
    #   * 0..2 (nothing .. colony ...city), for settlements
    #   * 0..1 (nothing .. road), for roads
    # * player is the player number: 1..4 (it's not related to server objects, it's
    #   only an ordinal value used to assign the proper css class).
    #
    # Example:
    #
    # <tt>({ s:[{c:[0,0,1,0,0,1],l:1,p:1}, {c:[0,0,1,0,1,-1],l:1,p:2}], r:[{c:[0,0,1,0],l:1,p:1}, {c:[1,0,1,-1],l:1,p:2}] })</tt>
    def current_infrastructures
      infrastructures = {}

      #collect settlements
      infrastructures[:s] =[]
      #settlements = DataModel::Settlement.where(:game_id => DataModel::Game.current.id)
      settlements = DataModel::Game.current.settlements
      settlements.each do |settlement|
        infrastructures[:s] << {:c => settlement.to_vertex.coords, :l => settlement.level, :p => settlement.player_id}
      end
      #add_to_check :settlements => settlements if(settlements.any?)

      #collect roads
      infrastructures[:r] = []
      roads = DataModel::Road.roads_on_map
      roads.each do |road|
        infrastructures[:r] << {:c => road.to_edge.coords, :l => 1, :p => road.player_id}
      end
      #add_to_check :roads => roads if(roads.any?)
      return infrastructures
    end

    def players_info
      DataModel::Game.current.players.sort_by(&:id).map(&:to_info)
    end

    #adds a list of players to the percept (used in ecocrime and production)
    def raw_players(players)
      players.map{|player| player.to_hash([:id, :user_id, :avatar, :slot, :total_score, :titanium, :magic_resource, :energy, :water, :silicon, :grain, :version])}
    end

    def current_market
      market = {}
      # FIXME:
      return market

      # cerca le offerte per cui sono trader (fatte da altre)
      all_offers = DataModel::Player.current.offers.map do |offer|
        offer.to_hash do |o|
          {:publisher_id => o.publisher.id}
        end
      end
      if all_offers.any?
        market[:offers] = all_offers
        #add_to_check :offers => Player.current.offers
      end

      # cerca le offerte per cui sono publisher (fatte da me)
      trade = DataModel::Player.current.trade_request
      if trade
        market[:trade_request] = trade.to_hash
        #add_to_check :trade => trade
        market[:trade_request][:offers] = trade.offers.map do |offer|
          offer.to_hash do |o|
            {:publisher_id => trade.publisher_id}
          end
        end
        #add_to_check :offers => trade.offers
      end
      return market
    end

  end
end