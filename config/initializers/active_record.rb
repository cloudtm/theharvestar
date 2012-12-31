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

#This class extends AR by adding conversions from/to hash. This is
#required to isolate AR and allow for an easier porting to other model
#representations/frameworks such as JPA
module ActiveRecord

  #specifically, we extend the Base class of AR
  class Base

    # Returns new (not saved) active records given their hash description.
    # * objs: can be a single attributes hash or an array of attribute hashes
    # Returns an AR instance or an array of AR instances.
    def self.new_from_hash objs
      case objs
      when Array
        return objs.map{|obj| self.new(obj)}
      when Hash
        return self.new(objs)
      end
      raise TypeError, "#{self.name}: new_from_hash accepts only an hash or an array of hashes!"
    end

    # Returns created (saved) active records given their hash description.
    # * objs: can be a single attributes hash or an array of attribute hashes
    # Returns an AR instance or an array of AR instances.
    def self.create_from_hash objs = {}
      # TODO Use import extension to fire 1 insert query!
      #self.create!(objs)
      new_objs = new_from_hash objs
      if new_objs.is_a?(Array)
        new_objs.each_with_index{|new_obj, index|
          # force the id if it is passed
          new_obj.id = objs[index][:id] if objs[index][:id]
          new_obj.save!
        }
      else
        # force the id if it is passed
        new_objs.id = objs[:id] if objs[:id]
        new_objs.save
      end      
      new_objs
    end

    # Returns updated (saved) active records given their hash description.
    # * objs: can be a single attributes hash or an array of attribute hashes
    # Returns an AR instance or an array of AR instances.
    def self.update_from_hash objs
      case objs
      when Array
        obj_ids = objs.map{|obj| obj[:id]}
        updated = self.update(obj_ids, objs)
        failed_ar = updated.detect {|ar| ar.errors.any? }
        raise ActiveRecord::RecordInvalid.new(failed_ar) if(failed_ar)
        return updated
      when Hash
        updated = self.update(objs[:id], objs)
        raise ActiveRecord::RecordInvalid.new(updated) if(updated.errors.any?)
        return updated
      end
      raise TypeError, "#{self.name}: new_from_hash accepts only an hash or an array of hashes!"
    end

    # This method destroies the AR objects represented by the hash objs
    def self.destroy_from_hash objs
      case objs
      when Array
        obj_ids = objs.map{|obj| obj[:id]}
        return self.destroy_all(:id => obj_ids)
      when Hash
        return self.destroy_all(:id => objs[:id])
      end
      raise TypeError, "#{self.name}: new_from_hash accepts only an hash or an array of hashes!"
    end

    #This method chesks if the AR  object represented by the hash obj exists
    def self.exists_from_hash? obj
      self.exists?(obj[:id])
    end

    # Returns a HashWithIndifferentAccess representation of the AR object
    def to_hash(selection = nil)
      if(selection)
        selection = [selection] if(!selection.is_a? Array)
        selection.map!{|attr| attr.to_s}
        selected_attrs = attributes.reject{|attr, val| !selection.include?(attr)}
      else
        selected_attrs = attributes
      end
      properties = HashWithIndifferentAccess.new(selected_attrs)
      properties.update(yield self) if block_given?
      return properties
    end

    class << self
      # Enum Field plugin
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
end