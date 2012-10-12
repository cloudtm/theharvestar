# Returns the appropriate map builder given the map type.
# Map type is the format of the game for which we want to generate the map.
class Map::MapFactory

  # Returns the map builder for the given type.
  def self.make(options = {:type => :base})
    builder_klass = "Map::#{options[:type].to_s.camelize}::Builder".constantize
    builder = builder_klass.new

    builder.map
  end
end

