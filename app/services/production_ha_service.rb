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

# This is needed for the ha service, seems that the same code in config/initializers/madmass.rb 
# don't affect the service.
#require File.join(Rails.root, 'config', 'initializers', 'madmass')

# High availability service, in charge of periodically rolling dices and
# sending production requests through JMS.
class ProductionHAService
  #include TorqueBox::Injectors
  include TorqueBox::Messaging::Backgroundable if defined?(TorqueBox::Messaging)
  include Madmass::Transaction::TxMonitor

  always_background :execute_action if defined?(TorqueBox::Messaging)
  
  # Intializes the service, mainly defining production interval and
  # the jms queue.
  def initialize(options={})
    Madmass::current_agent = Madmass::Agent::ProxyAgent.new(:status => 'init')
    @tick = options['sleep_time']
    # FIXME: remove and reenter the Game.created_at property
    @initial_time = Time.now
    Rails.logger.info "ProductionJob initialized ..."
  end

  # Starts the production
  def start
    Rails.logger.info "ProductionJob started"
    Thread.new { produce }
  end

  # Ends the production
  def stop
    Rails.logger.info "ProductionJob stopped"
    @done = true
  end

  private

  # Rolls sice and send a message for each active game
  # then sleeps
  def produce
    until @done
      begin
        roll = Dice.double_roll
        tx_monitor do
          DataModel::Game.find_by_states(['playing']).each do |game|
            next unless must_produce?(game)
            Rails.logger.debug "Publishing roll #{roll} to game #{game.id}"
            action_params = choose_action(game, roll)
            execute_action(action_params)
            #@queue.publish :roll => roll, :game => game[:id]
          end
        end
        sleep(@tick)
      rescue Exception => ex
        Rails.logger.error "ProductionHAService: #{ex.message}"
      end
    end
  end

  def execute_action(action_params)
    Madmass.current_agent.execute(action_params)
  end

  private
  

  def must_produce?(game)
    Rails.logger.debug "GAME: #{game.inspect}"
    players_count = game.players.size
    #tick_count = ( (Time.now - game.created_time).to_i / @tick)
    # FIXME: reenter the Game.created_at property
    tick_count = ( (Time.now - @initial_time).to_i / @tick)
    Rails.logger.debug "TICK: #{@tick} - #{@tick.class} | TICK COUNT: #{tick_count} | PLAYERS COUNT: #{players_count}"
    return case players_count
    when 1
      true
    when 2
      # every 2 ticks
      (tick_count % 2) == 0
    when 3, 4
      # every 3 ticks
      (tick_count % 3) == 0
    else
      Rails.logger.error "Error: A game have #{players_count} players! Min 1 max #{GameOptions.options(game.format)[:max_player_limit]}."
      false
    end
  end


  def choose_action(game, roll)
    if roll == bad_dice_roll(game)
      # ecocrime
      action_params = HashWithIndifferentAccess.new({
        :cmd => :ecocrime,
        :game_id => game.id
      })
    else
      # production
      action_params = HashWithIndifferentAccess.new({
        :cmd => :production,
        :roll => roll,
        :game_id => game.id
      })
    end
    action_params
  end

  def bad_dice_roll (game)
    GameOptions.options(game.format)[:bad_dice_roll]
  end

  
  
end
