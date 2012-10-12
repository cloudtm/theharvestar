# Use this builder to generate a new Base map. Usage:
#  mapBuilder = Map::Base::Builder.new()
#  terrains = mapBuilder.map()
class Map::Base::Builder < Map::MapBuilder

  # Creates a new base map builder. Use the #map method to generate and retrieve the
  # newly generated map.
  def initialize
    super
    # Will be populated with hash representations of map terrains
    @terrains = []

    # Terrain specification for a radius 3 map (keys are terrain types and values their number).
    @unassigned_terrains = expand_specification(GameOptions.options(:base)[:terrain_types])

    # Probaiblities specifications for a radius 3 map (keys are production probabilities for a terrain, the value is their number)
    @unassigned_probabilities = expand_specification(GameOptions.options(:base)[:production_probabilities])
  end

  # Builds a new map.
  #
  # Returns a new array of terrains hashes (not AR) for the base map format.
  def map
    generate_map if @terrains.blank?
    return @terrains
  end

  private

  # Creates new terrains for the Bas map.
  def generate_map
    (0 .. Map::Base::HexMap::MAP_RADIUS).each do |radius|
      ring_hexes = Map::Base::HexMap.ring(radius)
      @terrains += ring_hexes.map {|hex| get_terrain_hash(hex, radius)}
    end
  end

  # We pass also radius just to make faster type assignment
  def get_terrain_hash(hex, radius)
    type = (radius == Map::Base::HexMap::MAP_RADIUS ? :blank : get_tile_type(hex))
    probability = get_tile_probability(type)
    return {:x => hex.x, :y => hex.y, :production_probability =>  probability, :terrain_type => type}
  end

  # Returns an unassigned terrain type.
  def get_tile_type hex
    raise GameErrors::MapBuildError, "#{self.class.name}: no more terrains available for hex (#{hex.x},#{hex.y})!" if @unassigned_terrains.empty?
    return @unassigned_terrains.pop
  end

  # Returns an unassigned probability.
  def get_tile_probability type
    type = type.to_sym
    return 0 if(type == :blank or type == :terrain_1)
    raise GameErrors::MapBuildError, "#{self.class.name}: no more probability tokens available for type #{type})!" if @unassigned_probabilities.empty?
    return @unassigned_probabilities.pop
  end

end

