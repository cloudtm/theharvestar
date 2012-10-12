# This is the base class of all map builders. Every other builder inherits from this.
class Map::MapBuilder

  # Returns the builded map. In this case the class is abstract and it raises a GameErrors::MapBuildError
  # if you call this method.
  def map
    raise GameErrors::MapBuildError, "#{self.class.name}: is abstract, use specialized builders!"
  end

  # Specifications are hashes that lists a series of properties and their moltiplicity.
  # For example:
  #  {:grass => 3, :tree => 2}
  # See Map::Base::Builder#initialize for a real example.
  def expand_specification spec
    expand_shuffle spec
  end

  protected

  # Used by #expand_specification to transform the specification hash into an array. The
  # array content is randomized through shuffling. For example a specification like:
  #  {:grass => 3, :tree => 2}
  # becomes
  #  [:grass, :grass, :tree, :grass, :tree]
  # or any other permutation.
  def expand_shuffle spec
    expansion = []
    spec.each {|k, v| v.times{expansion << k} }
    expansion.shuffle
  end

end

