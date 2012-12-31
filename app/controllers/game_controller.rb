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

class GameController < ApplicationController

  respond_to :json, :html

  include ApplicationHelper
  include ActionView::Helpers::JavaScriptHelper
  include Madmass::Transaction::TxMonitor

  before_filter do |controller|
    tx_monitor do
      # the authenticate_agent in Madmass accept a block that permit to
      # put manage the application agent (the player in this case) and to
      # pass it to Madmass
      controller.authenticate_agent do
        # create the agent if not exists
        unless current_user.player
          current_user.create_player!
          current_user.save!
        end
        # set the current user
        User.current = current_user
        # set the current player
        DataModel::Player.current = current_user.player
        
        # FIXME: this is not needed in a perfect world
        DataModel::Player.current.user = current_user

        # set the current game if exists
        game = DataModel::Player.current.game
        DataModel::Game.current = game if game

        # return the player to Madmass to set it as the agent (the action executor)
        current_user.player
      end
    end
  end

  # The root action that renders the list or the game depending on the user state
  def index
    status = Madmass.current_agent.execute(:cmd => "#{current_user.state}_sensing")
    @sensing = Madmass.current_perception.first.data[:sensing]
    respond_to do |format|
      format.html {render :index, :status => status}
    end
  end

  #def comingsoon
  #  render :layout => 'comingsoon'
  #end

  def execute
    #load 'lib/actions/counter_offer_action.rb'
    actions = ActiveSupport::JSON::decode(params[:actions])
    return unless actions
    @perceptions = []
    actions.each do |action|
      action = HashWithIndifferentAccess.new(action)
      status = Madmass.current_agent.execute(action[:agent])
      #@perceptions += Madmass.current_perception
    end

    # FIXME: check if the game is finished
    if(DataModel::Game.current and DataModel::Game.current.winner)
      status = Madmass.current_agent.execute({:cmd => 'end_game'})
      logger.info "GAME FINISHED: #{Madmass.current_perception.inspect}"
    end

    respond_to do |format|
      format.html {render :execute, :status => status}
      format.json {render :json => Madmass.current_perception.to_json, :status => status}
    end

  rescue Madmass::Errors::StateMismatchError
    respond_to do |format|
      format.html {redirect_to :action => :index} #current_user.state}
      format.json {render :json => 'state mismatch'.to_json, :status => 500}
    end

  end

  # TODO: convert in madmass actions
  #def account
  #  game = params[:game]
  #  acc = game[:account]
  #
  #  if acc and acc[:cancel]
  #    current_user.delete_preview
  #    render :json => ['ok'], :status => :ok
  #  elsif acc and acc[:preview]
  #    current_user.update_attributes({:preview => acc[:preview]})
  #    render :json => {:tocrop => current_user.preview.url(:crop), :ratio => current_user.preview_ratio}, :status => :ok
  #  else
  #    @action = Mechanics::ActionFactory.make(game.merge({:cmd => :account}))
  #    @percept = @action.do_it
  #    render :json => ['ok'], :status => :ok
  #  end
  #
  #end

end

