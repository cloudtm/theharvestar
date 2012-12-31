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

class GameLocales
  include Singleton

  # we will search for yaml locales only in this dir ignoring all the I18n load paths.
  LOCALES_ROOT = File.join(Rails.root, 'config', 'locales')

  class << self

    # Returns a subset of locales picked from the current language. You can select
    # what to include with one or more selections that specify a key path, like in js.
    # - selections: a string or an array of strings. Example
    #  'action.game' or ['action', 'tutorial'] ...
    #
    # 'action.game' extracts only translations['action']['game'] where translation is the
    # translation hash in current language [:en, :it,...]. ['action', 'tutorial'] extracts
    # translations['action'] and translations['tutorial'] merging them in the same result hash.
    # Note: the full keys path is left in the result
    def get(selections)
      result = {}
      # Pickup the locales for the current language
      locales = @translations[I18n.locale]
      selections = [selections] if(selections.is_a? String)

      selections.each do |selection|
        key_path = selection.split('.')
        next if key_path.length == 0

        result_pointer = result
        locales_pointer = locales
        key_path.each_index do |i|
          key = key_path[i]
          if(i < key_path.length - 1)
            result_pointer[key] ||= {}
            result_pointer = result_pointer[key]
            locales_pointer = locales_pointer[key]
          else
            result_pointer[key] = locales_pointer[key]
          end
        end
      end
      return result
    end

    private

    def init
      @translations = HashWithIndifferentAccess.new
      Dir[File.join(LOCALES_ROOT, '*.yml')].sort.each do |locale|
        @translations.update(File.open(locale) { |yf|  YAML::load(yf) })
      end
    end

  end

  # Initialize automatically (at constantize) the class object!
  init

end
