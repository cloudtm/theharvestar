# Represent a concentric hexagonal map with radius MAP_RADIUS.
class Map::Base::HexMap

  # Map radius. Central tile is radius 0, first ring is radius 1 and so on
  MAP_RADIUS = 3
  # Center of the map, used to generate rings
  ORIGIN_HEXAGON = Map::Hex::Hex.new(0,0)
  # x coordinates of the hex ring at radius 1. Used to generate all the other rings.
  RING_GENERATOR = [0,1,1,0,-1,-1] unless defined? RING_GENERATOR

  class << self

    # Returns true if all the hexagons are within the map
    def in_map?(hexes)
      hexes.each do |hex|
        return false if hex.dist(ORIGIN_HEXAGON) > MAP_RADIUS
      end
      return true
    end

    # Returns true if the hexagons are blank tiles
    def blank_tiles?(hexes)
      hexes.each do |hex|
        return false unless blank_tile? hex
      end
      return true
    end

    # Returns true if the hexagon is a blank tiles
    def blank_tile?(hex)
      hex.dist(ORIGIN_HEXAGON) >= MAP_RADIUS
    end

    #returns true if the coordinates are in the middle column of the map
    def middle_column?(hex)
      hex.x == -hex.y
    end

    # Returns hexagons belonging to the ring of the given radius
    def ring(radius)
      raise(GameErrors::GvisionError, "#{self.name}: there are no rings with negative radius!") if radius < 0
      return [Map::Hex::Hex.new(0,0)] if radius == 0
      hexes = []
      coords_x = ring_generator(radius)
      coords_x.each_index  do |i|
        hexes << Map::Hex::Hex.new(coords_x.at(i), coords_x.at((radius * 2 + i) % coords_x.length))
      end
      return hexes
    end

    # Returns the array of x coordinates for the hexagon ring of the given radius.
    # y coordinates are obtained from index [2*radius].
    def ring_generator(radius)
      generator = []
      generator_size = RING_GENERATOR.size
      generator_size.times do |gen|
        radius.times do |weight|
          generator << RING_GENERATOR[gen] * (radius - weight) + RING_GENERATOR[(gen + 1) % generator_size] * weight
        end
      end
      return generator
    end

  end

end

