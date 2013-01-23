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

#This class implements the computation of the longest path.

require 'matrix'
require 'set'

class Matrix
  def []=(i, j, x)
    @rows[i][j] = x
  end
end

class Map::LongestPath::Planner

  def longest_path_len edges
    build_adj_matrix edges
    res = []
    for i in 0..@nodes_size-1 do
      res << max_length(i)
    end
    res.max || 0
  end

  def max_length v
    maxl = 0
    for w in 0..@nodes_size-1 do
      if (@g[v, w] || @g[w, v])
        @g[v, w] = false
        @g[w, v] = false
        maxl = [maxl, 1+max_length(w)].max
        @g[v, w] = true
        @g[w, v] = true
      end
    end
    return maxl
  end

  def build_adj_matrix edges
    nodes_map = get_nodes_map edges
    @nodes_size = nodes_map.size
    @g = Matrix.build(@nodes_size, @nodes_size) do |i, j|
      if (edges.find_index([nodes_map[i], nodes_map[j]]) || edges.find_index([nodes_map[j], nodes_map[i]]))
        true
      else
        false
      end
    end
  end

  def get_nodes_map edges
    nodes = []
    edges.each do |e|
      nodes << e[0]
      nodes << e[1]
    end
    nodes_set = nodes.to_set
    nodes_map = {}
    i=0
    nodes_set.each do |n|
      nodes_map[i] = n
      i = i+1
    end
    nodes_map
  end


end
