module Actions
  module PerceptionHelper

    # Allows easy access to the configuration variables in the game_options.yml
    def options key
      GameOptions.options(DataModel::Game.current.format)[key]
    end

    def user_data
      data = User.current.to_hash([:id, :nickname, :state, :score])
      data[:player] = DataModel::Player.current.to_hash([:id, :avatar, :slot, :ready])
      return [ data ]
    end

    # Adds all the users in the specified states (array)
    def users_in_states(states)
      User.where(:state => states).map(&:id)
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
      settlements = DataModel::Game.current.settlements
      settlements.each do |settlement|
        infrastructures[:s] << {:c => settlement.to_vertex.coords, :l => settlement.level, :p => settlement.player.id}
      end
      #add_to_check :settlements => settlements if(settlements.any?)

      #collect roads
      infrastructures[:r] = []
      roads = DataModel::Road.roads_on_map
      roads.each do |road|
        infrastructures[:r] << {:c => road.to_edge.coords, :l => 1, :p => road.player.id}
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
      #return market

      # cerca le offerte per cui sono trader (fatte da altre)
      all_offers = DataModel::Player.current.offers.map do |offer|
        offer.to_hash do |o|
          {:publisher_id => o.publisher ? o.publisher.id : nil}
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
            {:publisher_id => trade.publisher.id}
          end
        end
        #add_to_check :offers => trade.offers
      end
      return market
    end

    # Adds the trade request passed as argument.
    def trade_request trade_request
      unless trade_request
        return {}
      end

      #add_to_check :trade => trade_request
      td_hash = trade_request.to_hash do
        trade_offers = trade_request.offers.map do |offer|
          offer.to_hash do
            {:publisher_id => trade_request.publisher.id}
          end
        end
        {:offers => trade_offers}
      end
      #add_to_check :offers => trade_request.offers
      td_hash
    end

    def offer(offer_id)
      offer = DataModel::Offer.find_by_id(offer_id)
      this_trade_request = offer.trade_request
      
      #add_to_check :trade => trade_request
      #add_to_check :offer => offer
      #offer_percept = {}
      #offer_percept[:trade_request] ||= trade_request.to_hash
      #offer_percept[:trade_request][:offers] ||= []
      #offer_percept[:trade_request][:offers] << offer.to_hash do
      #  {:publisher_id => trade_request.publisher_id}
      #end

      players = []
      players << offer.trader.to_hash([:id, :user_id])
      players << this_trade_request.publisher.to_hash([:id, :user_id])
      
      offer_percept = { 
        :trade_request => trade_request(this_trade_request),
        :players => players
      }
      offer_percept
    end

    # Add to the game hash all informations needed by the final game summary.
    def summary
      summary = []
      # retrieve all player scores
      # sort players by total score
      players = DataModel::Game.current.players.sort_by(&:total_score)
      players.reverse.each do |player|
        user = player.user
        summary << {
          :id => player.id,
          :score => player.score,
          :total_score => player.total_score,
          :user_score => user.score,
          :user_img => user.picture.url(:small),
          :user_name => user.nickname,
          :longest_path => Score.transport_level(player),
          :cultural_level => Score.cultural_level(player),
          :game_awards => {
            :transport_score => Score.transport_score(player),
            :social_score => Score.social_score(player)
          }
        }
      end
      summary
    end

  end
end