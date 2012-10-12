# Terrains are entities placed on hexes. Terrains are placed on hexes and have a
# production probability and a type
module Cloudtm
  class Terrain

    include CloudTm::Model

    #enum_field :terrain_type, GameOptions.options(:base)[:terrain_types].keys

    #validates_uniqueness_of :game_id, :scope => [:x, :y]

    def attributes_to_hash
      {
        :id => oid,
        :x => x,
        :y => y,
        :production_probability => production_probability,
        :terrain_type => terrain_type
      }
    end

    def to_json
      attributes_to_hash.to_json
    end

    def terrain_label
      GameOptions.options(DataModel::Game.current.format)[:terrain_labels][terrain_type]
    end

    # Converts the Terrain to a geometrical object,
    # namely a hexagon of a hex grid
    def to_hex
      Map::Hex::Hex.new(x,y)
    end

    class << self

      # provided a dice roll, identifyies producing terrains in the current game and
      # updates the players' resources.
      # This method is called by the background job (and by no other) to produce resources
      #def produce options
      #  result = {}
      #
      #  #retrieve terrains that will produce
      #  producing_terrains = where(:game_id => DataModel::Game.current.id, :production_probability => options[:roll])
      #  not_wasted_terrains = producing_terrains - DataModel::Game.wasted_terrains
      #  result[:producing_terrains] = producing_terrains.map {|terrain| [terrain.x, terrain.y]}
      #  #update resources of players
      #  #result[:players] = []
      #  result[:raw_players] = []
      #  productions(not_wasted_terrains).each do |player_id, resources|
      #    #Player.update_counters(player_id, resources)
      #    player = Player.where(:id => player_id).first # The query also pick ups the newly updated values by the previous update_counters
      #    player.update_resources(resources)
      #    result[:raw_players] << player
      #    #result[:players] << player.to_percept
      #  end
      #  Game.current.reload
      #  return result
      #end
      #
      ## returns a hash with this structure: {:wasted_terrain => [[x1,y1],[x2,y2]...]}
      ## each couple xk,yk identifies a terrain that has become unproductive because it's currently controlled by robber.
      ## The unproductive terrain set is created using a random distribution
      #def waste_terrains(params)
      #  result = {}
      #  if(params[:wasted_terrains])
      #    result[:wasted_terrains] = params[:wasted_terrains]
      #    params[:wasted_terrains].each do |wasted|
      #      terrain = where(:game_id => DataModel::Game.current.id, :x => wasted[0], :y => wasted[1]).first
      #      Calamity.happens terrain
      #    end
      #  else
      #    result[:wasted_terrains] = []
      #    # asks DB all the terrains that can host the robber
      #    target_terrain_type = (1..6).map{|i| "terrain_"+i.to_s}
      #    target_terrains = (where(:game_id => DataModel::Game.current.id,:terrain_type => target_terrain_type))
      #    # selects randomically the target_terrain subset that will be host
      #    wasted_terrains_size = GameOptions.options(DataModel::Game.current.format)[:wasted_amount]
      #    wasted_terrains_indexes = wasted_terrains_size.times.map{rand target_terrains.size}
      #    wasted_terrains_indexes.uniq!
      #    #collects all the information in the result hash
      #    wasted_terrains_indexes.each do |index|
      #      result[:wasted_terrains] << [target_terrains[index].x, target_terrains[index].y]
      #      DataModel::Calamity.happens target_terrains[index]
      #    end
      #  end
      #  result
      #end
      #
      #
      ##returns the resources to be added to players when producing_terrains produce
      ##In detail: returned value is a hash containing an entry for each player whose resources have to be incremented.
      ##Each player entry follows this pattern: player_id => <resource_increment_hash>.
      ##Each resource_hash entry  follows instead this pattern:  :resource_type => increment.
      ##E.g. {1 => {:grain => 1},14 => {:grain =>2,:ore=>1}}
      #def productions producing_terrains
      #  production = {}
      #  producing_terrains.each do |t|
      #    t.settlements.each do |s|
      #      production[s.player_id] ||= {}
      #      resource_type = GameOptions.options(DataModel::Game.current.format)[t.terrain_type]
      #      production[s.player_id][resource_type] ||= 0
      #      production[s.player_id][resource_type] += 1*s.level; #FIXME depends on settlement_type
      #    end
      #  end
      #
      #  return production
      #end

      # Returns an array of Terrains
      #def find_by_hexes hexes
      #  query = []
      #  hash = {}
      #  hexes.each_with_index do |h, idx|
      #    query << "(x = :x#{idx} and y = :y#{idx})"
      #    hash[:"x#{idx}"] =h.x
      #    hash[:"y#{idx}"] =h.y
      #  end
      #
      #  where_query = "game_id = :game and "
      #  where_query += "(#{query.join(" or ")})"
      #
      #  return where(where_query, {:game => DataModel::Game.current.id}.merge(hash) )
      #end

    end


  end
end
