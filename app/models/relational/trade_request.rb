# This class represents a trade request that a player can make to initiate a resources
# exchange with other players in the game.
module Relational
	class TradeRequest < ActiveRecord::Base
	  # can mass assign some attributes
      attr_accessible :receive
	  
	  # the request sender
	  belongs_to :publisher, :class_name => '::DataModel::Player'
	  has_many :offers, :dependent => :destroy

	  validates  :publisher, :presence => true
	  
	  serialize :receive, Hash	  
	end
end