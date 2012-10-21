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
    status = Madmass.current_agent.execute(:cmd => "list_sensing")
    #status = Madmass.current_agent.execute(:cmd => "#{current_user.state}_sensing")
    @sensing = Madmass.current_perception.first.data[:sensing]
    respond_to do |format|
      format.html {render :index, :status => status}
    end
  end

  # The root action that renders the game
  #def play
  #  return unless action_monitor do
  #    @game_log.action({:cmd => :"#{current_user.state}_sensing"}) do |action_params|
  #      @action = Mechanics::ActionFactory.make(action_params)
  #      @percept = @action.do_it
  #      {:action => @action, :percept => @percept}
  #    end
  #  end
  #end

  #def comingsoon
  #  render :layout => 'comingsoon'
  #end

  def execute
    actions = ActiveSupport::JSON::decode(params[:actions])
    return unless actions
    actions.each do |action|
      action = HashWithIndifferentAccess.new(action)
      status = Madmass.current_agent.execute(action[:agent])
      @perception = Madmass.current_perception
    end

    respond_to do |format|
      format.html {render :execute, :status => status}
      format.json {render :json => @perception.to_json, :status => status}
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

