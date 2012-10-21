require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "create game action in torquebox" do

  @content_type = 'application/json'
  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "should create a new game" do
    create_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'create_game',
          'name' => 'test-game'
        }
      }]
    )
    json_data = JSON.parse(create_game_response.body).first
    json_data['status']['code'].should eq('ok')
    json_data['data']['users'].first['nickname'].should eq("nick-1")
  end

end
