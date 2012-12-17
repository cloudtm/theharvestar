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