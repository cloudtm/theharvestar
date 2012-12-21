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
     puts "#{@g.inspect}"
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
