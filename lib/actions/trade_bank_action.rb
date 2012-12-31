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

# This is a sensing action (only perception). It provides the latest view of the game.
module Actions
  class TradeBankAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :give, :receive
    action_states :play

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    def process_params      
      # If the request comes from a raiders exchange => give and receive are 2 resource strings.
      # If the request comes from a recycle exchange => give is "magic_resource" and receive is a resource hash
      if(@parameters[:receive].kind_of? Hash)
        @trade_income = @parameters[:receive]
        quantity = 0;
        # Converts string values to integers
        @trade_income.each do |resource, count|
          @trade_income[resource] = count.to_i
          quantity += @trade_income[resource]
        end
        @msg = {
          :name => :research_not_enough_recycle, 
          :key => 'action.research.not_enough_recycle', 
          :subs => {:count => quantity}
        }
      else
        @trade_income = {@parameters[:receive] => income} 
        quantity = 1
        @msg = {
          :name => :market_no_bank_resources,
          :key => 'action.market.no_bank_resources',
          :subs => {:cost => (quantity * compute_rate).abs, :give => @parameters[:give], :count => quantity, :receive => @parameters[:receive]}
        }
      end
      @trade_costs = {@parameters[:give] => quantity * compute_rate}
    end

    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      DataModel::Player.current.pay! @trade_costs
      DataModel::Player.current.receive! @trade_income

      # FIXME: chenge this
      # increment game and players version
      DataModel::Game.current.increase_version
      DataModel::Player.current.increase_version
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :clients => [ User.current.id ] }) #who must receive the percept
      p.data = DataModel::Player.current.to_percept.merge(
        :event => 'update-player',
        :version => DataModel::Game.current.version
      )
      Madmass.current_perception << p
      
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      # Check if the player has enough resources for exchange resources
      unless DataModel::Player.current.can_buy? @trade_costs
        why_not_applicable.publish(@msg)
      end
      
      return why_not_applicable.empty?
    end

    private

    def compute_rate
      @parameters[:give] == 'magic_resource' ? options(:magic_rate) : options(:bank_rate)
    end

    def income
      options(:trade_income)
    end

  end

end
