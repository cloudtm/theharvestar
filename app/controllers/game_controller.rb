class GameController < ApplicationController
  protect_from_forgery

  respond_to :json, :html

  include ApplicationHelper
  include ActionView::Helpers::JavaScriptHelper
  include Madmass::Transaction::TxMonitor

  before_filter :authenticate_agent

  def index
    tx_monitor do
      game = DataModel::Game.create
    end
    status = Madmass.current_agent.execute(:cmd => 'list_sensing')
    @sensing = Madmass.current_perception.first.data[:sensing]
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

