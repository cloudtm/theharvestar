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
