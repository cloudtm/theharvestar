class GameController < ApplicationController
  # FIXME: temporary commented because the test environment don't work
  # protect_from_forgery
  # skip_before_filter :verify_authenticity_token

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
        # set the current game if exists
        game = current_user.player.game
        DataModel::Game.current = game if game

        # return the player to Madmass to set it as the agent (the action executor)
        current_user.player
      end
    end
  end

  def index
    status = Madmass.current_agent.execute(:cmd => 'list_sensing')
    logger.debug "STATUS: #{status}"
    @sensing = Madmass.current_perception.first.data[:sensing]
    logger.debug "PERCEPT: #{Madmass.current_perception.inspect}"
    respond_to do |format|
      format.html {render :index, :status => status}
    end

  end

  def execute
    return unless params[:agent]
    status = Madmass.current_agent.execute(params[:agent])
    @perception = Madmass.current_perception

    respond_to do |format|
      format.html {render :execute, :status => status}
      format.json {render :json => @perception.to_json, :status => status}
    end

  rescue Madmass::Errors::StateMismatchError
    # redirect_to :action => current_user.state
  end


end

