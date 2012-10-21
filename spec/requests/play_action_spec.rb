require 'spec_helper'
require 'open-uri'
require 'net/http'

{"actions"=>"[{\"agent\":{\"cmd\":\"create_game\",\"format\":\"base\",\"name\":\"game_7\"}}]"}
{"actions"=>"[{\"agent[cmd]\":\"create_game\",\"agent[name]\":\"test-ready-game\"}]", "auth_token"=>"T1p7AH8sXzEiKUyPkivN"}

describe "play actions in torquebox" do

  @content_type = 'application/json'
  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "game should play" do
    # there is a minimum number of players that can start a game
    create_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'create_game',
          'name' => 'test-play-game'
        }
      }]
    )
    game_data = JSON.parse(create_game_response.body).first
    game_data['data']['users'].first['state'].should eq('join')

    ready_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 'cmd' => 'ready' }
      }]
    )
 
    # join other users to the game
    2.upto(GameOptions.options(:base)[:min_player_limit]) do |index|
      auth_token = signin_with('email' => "test-user-#{index}@email.com", 'password' => 'password')

      join_game_response = invoke_remote_action(
        'auth_token' => auth_token,
        'actions' => [{ 
          'agent' => {
            'cmd' => 'join_game',
            'game_id' => game_data['data']['id'],
            'slot' => index
          }
        }]
      )
      ready_response = invoke_remote_action(
        'auth_token' => auth_token,
        'actions' => [{ 
          'agent' => { 'cmd' => 'ready' }
          }]
      )

    end

    # the game should start playing
    play_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 'cmd' => 'play' }
        }]
    )
    JSON.parse(play_game_response.body).each do |percept|
      case percept['data']['event'] 
      when 'game-started'
        percept['data']['id'].should eq(game_data['data']['id'])  
      when 'manage-state'
        percept['data']['users'].first['state'].should eq('play')  
      end  
    end
    
  end


end
