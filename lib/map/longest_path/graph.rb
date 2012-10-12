#require "#{File.dirname(__FILE__)}/planner.rb"

#maintains a representation of a graph as a set of edges. Computes the longest path on an arbitrary graph
# and provides the basic functionalities for graph navigation
class Map::LongestPath::Graph
  attr_accessor :edges

  #intialize the graph with an array of edges
  #Edges are bi-dimensional arrays of numbers
  #e.g., [5,2] is an edge where 5 and 2 are the
  #two ids of the two nodes of the edge
  def initialize edges
    @edges = edges.clone
    @traversed_edges = []
  end


  #get all  neighbors of node
  def get_successors node
    successors = []
    @edges.each do |e|
      successors << e[0] if e[1] == node
      successors << e[1] if e[0] == node
    end
    return successors
  end


  #Compute the longest path on the entire graph
  def longest_path
    max = []
    planner = Map::LongestPath::Planner.new self
    components.each do |c|
      path = planner.longest_path(c)

      if path.size > max.size
        max = path
      end
    end
    return max
  end

  private

  #compute connected components
  #depth first search
  def get_component_nodes node
    open = [node]
    visited = []
    until open.empty?

      node = open.pop
      visited << node unless visited.include?(node) #TODO why this happens?

      successors = get_successors(node)
      successors.each do |s|
        open << s unless visited.include?(s)
      end
    end
    return visited
  end

  #get all the components of the graph
  #as an array of graphs (i.e. lists of edges)
  def components
    edges_to_traverse =@edges.clone
    component_list = []

    until edges_to_traverse.empty?
      component_nodes = get_component_nodes(edges_to_traverse.first[0])
      component_list << component_nodes
      edges_to_traverse = cleanup(edges_to_traverse, component_nodes)
    end

    component_list
  end

  # returns a graph (set of edges)
  # as $edges, but  without all the edges
  # that connect to nodes in $nodes
  def cleanup edges, nodes
    new_edges = []
    edges.each do |e|
      new_edges << e unless (nodes.include?(e[0]) or nodes.include?(e[1]))
    end
    return new_edges
  end
end

