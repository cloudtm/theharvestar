require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "ready actions in torquebox" do

  @content_type = 'application/json'
  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "game should not be ready" do
    # there is a minimum number of players that can start a game
    create_game_response = invoke_remote_action(
      'agent[cmd]' => 'create_game',
      'agent[name]' => 'test-ready-game',
      'auth_token' => @auth_token
    )
    game_data = JSON.parse(create_game_response.body).first
    game_data['data']['users'].first['state'].should eq('join')

    ready_response = invoke_remote_action(
      'agent[cmd]' => 'ready',
      'auth_token' => @auth_token
    )
    ready_data = JSON.parse(ready_response.body).first
    ready_data['data']['game']['state'].should eq('joining')
    ready_data['data']['users'].first['state'].should eq('join')

    # join other users to the game
    2.upto(GameOptions.options(:base)[:min_player_limit]) do |index|
      auth_token = signin_with('email' => "test-user-#{index}@email.com", 'password' => 'password')

      join_game_response = invoke_remote_action(
        'agent[cmd]' => 'join_game',
        'agent[game_id]' => game_data['data']['game']['id'],
        'agent[slot]' => index,
        'auth_token' => auth_token
      )
      ready_response = invoke_remote_action(
        'agent[cmd]' => 'ready',
        'auth_token' => auth_token
      )

    end

    # the game should start playing
    ready_data = JSON.parse(ready_response.body).first
    ready_data['data']['game']['state'].should eq('playing')
  end


end
