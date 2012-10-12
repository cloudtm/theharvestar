# This class has the responsibility to load and mantain in memory all game options
# in config/game_options.yml configuration file.
class GameOptions
  include Singleton

  class << self

    # Returns the options for the given type.
    def options type
      #HashWithIndifferentAccess.new @options[type]
      @options[type.to_sym]
    end

    # Returns the resource list of a given game_format (e.g. resource list of :base game)
    def resource_list game_format
      terrain_types = options(game_format)[:terrain_types].keys
      list = []
      terrain_types.each do |t|
        curr_resource = options(game_format)[t]
        list << curr_resource unless curr_resource.nil?
      end
      list
    end

    def unproductive? game_format, t_type
      options(game_format)[t_type].nil?
    end

#    def resource_column resource
#      return resource.to_s
#    end

    private

    # Loads the game configuration maintained in config/game_options.yml
    def init
      @options = {} #HashWithIndifferentAccess.new
      @options_path = File.join(Rails.root, 'config', 'game_options.yml')
      load_options
    end

    # Called by init to load the configuration file.
    def load_options
      raise "Cannot find game options file at #{@options_path}" unless File.file?(@options_path)
      #@options = File.open(@options_path) { |yf|  HashWithIndifferentAccess.new(YAML::load(yf)) }
      @options = File.open(@options_path) { |yf|  YAML::load(yf) }
    end

  end

  # Initialize automatically (at constantize) the class object!
  init
  
end
