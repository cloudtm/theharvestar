#This class implements the computation of the longest path
#on a connected graph represented as a list of edges.



class Map::LongestPath::Planner

  def initialize graph
    @graph = graph
  end

  #returns the longest path
  #of a connected graph ($component)
  def longest_path component
    return [] if component.empty?
    sources = get_source_nodes(component)
    max = []
    sources.each do |s|
      path = recursive_longest_path(s, [], 0)
      max = path if (path.size > max.size)
    end

    if sources.empty?
      max= recursive_longest_path(component.first, [], 0)
    end
    return max
  end


  private
  #get all nodes that have degree one
  def get_source_nodes component
    sources = []
    component.each do |c|
      sources << c if (count(@graph.edges, c) == 1)
    end
    return sources
  end

  #recursive function that computes the longest path
  #given a start node
  def recursive_longest_path s, visited, dist

    successors= @graph.get_successors(s)
    new_successors = []
    successors.each do |succ|
      new_successors << [s, succ] unless (visited.include?([s, succ]) or visited.include?([succ, s]))

    end
    return visited if  new_successors.empty?

    max = []
    new_successors.each do |suc|
      new_visited = visited.clone
      new_visited << suc
      path=recursive_longest_path(suc[1], new_visited, dist+1)
      max = path if path.size > max.size
    end
    return max
  end

  #returns the degree of a node c
  #given a graph (i.e. $edges)
  def count edges, c
    count = 0
    edges.each do |e|
      count= count + 1 if ((e[0] == c) or (e[1] == c))
    end
    count
  end

end
