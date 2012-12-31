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

module EnumField
  def self.included(klass)
    klass.class_eval { extend EnumField::ClassMethods }
  end
  
  module ClassMethods
    # enum_field encapsulates a validates_inclusion_of and automatically gives you a 
    # few more goodies automatically.
    # 
    #     class Computer < ActiveRecord:Base
    #       enum_field :status, ['on', 'off', 'standby', 'sleep', 'out of this world']
    # 
    #       # Optionally with a message to replace the default one
    #       # enum_field :status, ['on', 'off', 'standby', 'sleep'], :message => "incorrect status"
    # 
    #       #...
    #     end
    # 
    # This will give you a few things:
    # 
    # - add a validates_inclusion_of with a simple error message ("invalid #{field}") or your custom message
    # - define the following query methods, in the name of expressive code:
    #   - on?
    #   - off?
    #   - standby?
    #   - sleep?
    #   - out_of_this_world?
    # - define the STATUSES constant, which contains the acceptable values
    def enum_field(field, possible_values, options={})
      message = options[:message] || "invalid #{field}"
      const_set field.to_s.pluralize.upcase, possible_values unless const_defined?(field.to_s.pluralize.upcase)
  
      possible_values.each do |current_value|
        method_name = current_value.to_s.downcase.gsub(/[-\s]/, '_')
        define_method("#{method_name}?") do
          self.send(field) == current_value
        end
      end
  
      validates_inclusion_of field, :in => possible_values, :message => message
    end
  end
end

ActiveRecord::Base.class_eval { include EnumField }