require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "build outpost actions in torquebox" do

  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "outpost should be built" do
    game_data = initialize_game(@auth_token, 'build-outpost')

    build_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'build_outpost',
          'target' => [0, 0, 1, 0, 1, -1]
        }
      }]
    )
    build_data = JSON.parse(build_response.body).first
    #puts build_data.inspect
    build_data['data']['event'].should eq('update-player')
    # TODO: assertions
  end


end
