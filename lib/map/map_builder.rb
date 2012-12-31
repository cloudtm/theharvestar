###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# TheHarvestar is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# TheHarvestar is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with TheHarvestar.  If not, see <http://www.gnu.org/licenses/>.
#
# Copyright (c) 2010-2013 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Largo Alfredo Oriani 12
# 00152 Rome, Italy
#
###############################################################################
###############################################################################

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

