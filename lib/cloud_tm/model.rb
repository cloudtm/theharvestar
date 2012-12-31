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

module CloudTm
  module Model

    def self.included(base)
      base.extend(ClassMethods)
    end

    module ClassMethods

      def app
        FenixFramework.getDomainRoot().getApp
      end

      def find_by_id(id)
        # CHECK: fenix raise exception when id not exists
        return nil unless id
        FenixFramework.getDomainObject(id)
      end

      def where(options = {})
        instances = []
        all.each do |instance|
          instances << instance if instance.has_properties?(options)
        end
        return instances
      end

      #def all
      #  root = manager.getRoot
      #  return root.getAgents
      #end

      def create attrs = {}, &block
        instance = new
        attrs.each do |attr, value|
          instance.send("#{attr}=", value)
        end
        block.call(instance) if block_given?
        instance
      end

      private

    end

    def id
      getExternalId
    end


    def update_attributes attrs = {}
      attrs.each do |property, value|
        update_attribute property, value        
      end
    end

    def update_attribute attr, value
      send("#{attr}=", value)
    end

    def has_properties?(options)
      options.each do |prop, value|
        return false if send(prop) != value
      end
      true
    end

    def inspect
      attributes_to_hash.inspect
    end

    def save
      # does nothing, kept for compatibility with AR
    end
    
    def save!
      # does nothing, kept for compatibility with AR
    end

    def destroy
      # does nothing, depends on implementation on subclasses
    end

    def reload
      # does nothing, kept for compatibility with AR
    end

    def to_hash(selection = nil)
      if (selection)
        selection = [selection] if (!selection.is_a? Array)
        #selection.map!{|attr| attr.to_s}
        selected_attrs = attributes_to_hash.reject { |attr, val| !selection.include?(attr) }
      else
        selected_attrs = attributes_to_hash
      end
      properties = HashWithIndifferentAccess.new(selected_attrs)
      properties.update(yield self) if block_given?
      return properties
    end

    def app
      FenixFramework.getDomainRoot().getApp
    end

  end
end
