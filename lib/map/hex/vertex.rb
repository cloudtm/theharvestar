# We use the Hexmap Coordinate System described here
# http://3dmdesign.com/development/hexmap-coordinates-the-easy-way
# A hex vertex is defined by a triple of hexes
class Map::Hex::Vertex
  
  # attribute readers for the coordinates of the hex
  attr_reader :x,:y

  # Use this factory method to instatiate a vertex.
  # * coords: an array of six coordinates [x1,y1,x2,y2,x3,y3] that specifies 3 hexagons.
  #   Example: [0,0,1,0,0,1], where the first pair of cooridinates (0,0) defines the first hexagon,
  #   the second pair (1,0) defines the second hexagon and the third pair (0,1) defines the third hexagon.
  def self.factory coords
    valid? coords do |hex1, hex2, hex3|
      self.new hex1, hex2, hex3
    end
  end

  # Validates the six coordinates [x1,y1,x2,y2,x3,y3] that should specify the vertex. It can be used in 2 ways:
  # * without specifying a block:  it will simply return the validation result in the form of true or false
  # * specifying a block: it will raise a GameErrors::WrongInputError if the validation does not pass.
  # If you use a block, it will recevie the 3 Hex objects that define the vertex.
  def self.valid? coords
    error = nil
    result = false

    case
    when coords.nil?
      error = "#{self.name}: you are trying to create a vertex with nil coordinates!"
    when coords.size != 6
      error = "#{self.name}: wrong number of coords, should be 6 but are #{coords.size}"
    end

    if(error.blank?)
      h1 = Map::Hex::Hex.new(coords[0], coords[1])
      h2 = Map::Hex::Hex.new(coords[2], coords[3])
      h3 = Map::Hex::Hex.new(coords[4], coords[5])

      if(h1.dist(h2) == 1 and h1.dist(h3) == 1 and h2.dist(h3) == 1)
        result = block_given? ? yield(h1,h2,h3) : true
      else
        error = "#{self.name}: the coordinates do not define a valid vertex!"
      end

    end
    raise GameErrors::WrongInputError, error if(block_given? and !error.blank?)
    return result
  end

  # Returns the array of six coordinates [x1,y1,x2,y2,x3,y3]. Each coordinate pair defines one hexagon.
  def coords
    [@hex1.x, @hex1.y,
      @hex2.x, @hex2.y,
      @hex3.x, @hex3.y]
  end

  # Verifies if 2 vertex are the same one.
  # * other is the Vertex to compare.
  # Returns true if the 2 vertex are the same one, false otherwise.
  def eql? other
    @x.eql? other.x and @y.eql? other.y
  end

  # Returns an unique hash (String) of this vertex. It is coordinate based, so each Vertex instance
  # that represent the same geometric vertex will return the same hash.
  def hash
    "#{@x},#{@y}".hash
  end

  def to_s
    "#{@x},#{@y}"
  end

  # Returns the set of vertexes at distance one
  def neighbors
    result = []
    #For each edge directly connected to this vertex
    edges.each do |e|
      #generate the 2 vertexes of the edge
      candidates = e.vertexes
      #discard this vertex
      candidates = candidates - [self]
      #add the remaining vertex to the result
      result << candidates[0]
    end
    
    return result

  end

  # Returns an array of the three edges directly connected to this vertex
  def edges
    return [
      Map::Hex::Edge.new(@hex1, @hex2),
      Map::Hex::Edge.new(@hex1, @hex3),
      Map::Hex::Edge.new(@hex2, @hex3)]
  end

  # Returns the three hexes that identify the vertex
  def hexes
    [@hex1, @hex2, @hex3]
  end

  private

  # Vertex constructor is private. The only way to create one is to use the above factory.
  # The factory checks the validitiy of the input data.
  def initialize hex1, hex2, hex3
    @hex1 = hex1
    @hex2 = hex2
    @hex3 = hex3
    @x = @hex1.x + @hex2.x + @hex3.x
    @y = @hex1.y + @hex2.y + @hex3.y
  end


end
