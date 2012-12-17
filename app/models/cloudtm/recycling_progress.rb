module Cloudtm
	# This class represents the Recycling Research & Development Progress.
	# If the player uses this development progress gains N (amount specified in Game Options: recycle_amount)
	# resource units because he has recycled them. The type of resource units is chosen
	# by the player when he plays the progress (Mechanics::UseProgressAction).
	class RecyclingProgress < RedProgress

	  def effect
	    DataModel::Player.current.add_magic_resource GameOptions.options(DataModel::Game.current.format)[:recycling_prize]
	    used!
	  end
	end
end
