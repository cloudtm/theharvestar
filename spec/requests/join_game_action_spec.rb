require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "join game action in torquebox" do

  @content_type = 'application/json'
  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "should not join in a game" do
    join_game_response = invoke_remote_action(
      'agent[cmd]' => 'join_game',
      'agent[game_id]' => '0',
      'agent[slot]' => 2,
      'auth_token' => @auth_token
    )
    json_data = JSON.parse(join_game_response.body).first
    json_data['status']['code'].should eq('precondition_failed')
    json_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    json_data['data']['why_not_applicable'].should eq('game_not_exist')
  end

  it "should join in a game" do
    create_game_response = invoke_remote_action(
      'agent[cmd]' => 'create_game',
      'agent[name]' => 'test-game',
      'auth_token' => @auth_token
    )
    game_data = JSON.parse(create_game_response.body).first

    # slot already taken
    join_game_response = invoke_remote_action(
      'agent[cmd]' => 'join_game',
      'agent[game_id]' => game_data['data']['game']['id'],
      'agent[slot]' => 1,
      'auth_token' => @auth_token
    )
    json_data = JSON.parse(join_game_response.body).first
    json_data['status']['code'].should eq('precondition_failed')
    json_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    json_data['data']['why_not_applicable'].should eq('slot_taken')

    # join all users
    2.upto(GameOptions.options(:base)[:max_player_limit]) do |index|
      auth_token = signin_with('email' => "test-user-#{index}@email.com", 'password' => 'password')

      join_game_response = invoke_remote_action(
        'agent[cmd]' => 'join_game',
        'agent[game_id]' => game_data['data']['game']['id'],
        'agent[slot]' => index,
        'auth_token' => auth_token
      )
      join_data = JSON.parse(join_game_response.body).first
      join_data['status']['code'].should eq('ok')
      join_data['data']['users'].first['nickname'].should eq("nick-#{index}")
      join_data['data']['users'].first['state'].should eq('join')

      if index >= GameOptions.options(:base)[:min_player_limit]
        join_data['data']['game']['state'].should eq('armed')
      end
    end

    # verify that the game is full
    extra_index = GameOptions.options(:base)[:max_player_limit] + 1
    auth_token = signin_with('email' => "test-user-#{extra_index}@email.com", 'password' => 'password')
    join_game_response = invoke_remote_action(
      'agent[cmd]' => 'join_game',
      'agent[game_id]' => game_data['data']['game']['id'],
      'agent[slot]' => extra_index,
      'auth_token' => auth_token
    )
    join_datas = JSON.parse(join_game_response.body)
    join_data = join_datas.first
    join_data['status']['code'].should eq('precondition_failed')
    join_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    join_data['data']['why_not_applicable'].should eq('game_full')
  end
end
