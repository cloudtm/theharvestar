# We use the Hexmap Coordinate System described here
# http://3dmdesign.com/development/hexmap-coordinates-the-easy-way
#An edge is defined as a pair of hexes
class Map::Hex::Edge
  # x and y coordinates in hexagon space.
  attr_reader  :x, :y

  # Use this factory method to instantiate an edge.
  # * coords: an array of four coordinates [x1,y1,x2,y2] that specifies 2 hexagons.
  #   Example: [0,0,1,0], where the first pair of cooridinates (0,0) defines the first hexagon and
  #   the second pair (1,0) defines the second hexagon.
  def self.factory coords
    valid? coords do |hex1, hex2|
      self.new hex1, hex2
    end
  end

  # Validates the four coordinates [x1,y1,x2,y2] that should specify the edge. It can be used in 2 ways:
  # * without specifying a block:  it will simply return the validation result in the form of true or false
  # * specifying a block: it will raise a GameErrors::WrongInputError if the validation does not pass.
  # If you use a block, it will receive the 2 Hex objects that define the edge.
  def self.valid? coords
    error = nil
    result = false

    case
    when coords.nil?
      error = "#{self.name}: you are trying to create an edge with nil coordinates!"
    when coords.size != 4
      error = "#{self.name}: wrong number of coords, should be 4 but are #{coords.size}"
    end

    if(error.blank?)
      h1 = Map::Hex::Hex.new(coords[0], coords[1])
      h2 = Map::Hex::Hex.new(coords[2], coords[3])

      if(h1.dist(h2) == 1)
        result = block_given? ? yield(h1,h2) : true
      else
        error = "#{self.name}: the coordinates do not define a valid edge!"
      end

    end
    raise GameErrors::WrongInputError, error if(block_given? and !error.blank?)
    return result
  end

  # Returns the array of four coordinates [x1,y1,x2,y2]. Each coordinate pair defines one hexagon.
  def coords
    [@hex1.x, @hex1.y,
      @hex2.x, @hex2.y]
  end


  # Returns the 2 Hexagon that define this edge.
  def hexes
    [@hex1, @hex2]
  end

  # Verifies if 2 edges are the same one.
  # * other is the Edge to compare.
  # Returns true if the 2 edges are the same one, false otherwise.
  def eql? other
    @x == other.x and @y == other.y
  end

  # Returns an unique hash (String) of this edge. It is coordinate based, so each Edge instance
  # that represent the same geometric edge will return the same hash.
  def hash
    "#{@x},#{@y}".hash
  end

  # Returns the 2 Vertex of this edge.
  def vertexes
    result = []
    nodes = @hex1.neighbors & @hex2.neighbors
    result << Map::Hex::Vertex.new(@hex1, @hex2, nodes[0])
    result << Map::Hex::Vertex.new(@hex1, @hex2, nodes[1])
    return result
  end

  private

  # Edge constructor is private. The only way to create one is to use the above factory.
  # The factory checks the validitiy of the input data.
  def initialize hex1, hex2
    @hex1 = hex1
    @hex2 = hex2
    @x =@hex1.x+@hex2.x
    @y =@hex1.y+@hex2.y
  end
  
end