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

# This class represents a trade request that a player can make to initiate a resources
# exchange with other players in the game.
module Cloudtm
  class TradeRequest
	include CloudTm::Model

	#validates  :publisher, :presence => true
	#serialize :receive, Hash	  

	def attributes_to_hash
      {
        :id => id,
        :receive => receive,
        :publisher_id => publisher ? publisher.id : nil 
      }
    end

	class << self
	  def create attrs = {}, &block
	    instance = new
	    attrs.each do |attr, value|
	      if attr.to_s == 'receive'
	      	receive = DataModel::ResourceHash.create(value)
	      else
	      	instance.send("#{attr}=", value)
	      end 	      
	    end
	    block.call(instance) if block_given?
	    instance
	  end
	end

  end
end