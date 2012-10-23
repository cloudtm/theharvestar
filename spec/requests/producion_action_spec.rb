require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "production actions in torquebox" do

  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "production should be fired" do
    # there is a minimum number of players that can start a game
    create_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'create_game',
          'name' => 'test-production-game'
        }
      }]
    )
    game_data = JSON.parse(create_game_response.body).first
    
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

    production_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'production',
          'game_id' => game_data['data']['id'],
          'roll' => 3
        }
      }]
    )
    production_data = JSON.parse(production_response.body).first
    puts production_data.inspect
    # TODO: assertions
  end


end
