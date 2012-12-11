require 'spec_helper'
require 'open-uri'
require 'net/http'


describe "build link actions in torquebox" do

  @auth_token = nil

  deploy <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../..
  DD_END

  before do
    @auth_token = signin_with("email" => "test-user-1@email.com", "password" => "password")
  end

  it "link not connected" do
    game_data = initialize_game(@auth_token, 'build-link')

    #
    build_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'build_link',
          'target' => [0, 0, 1, 0]
        }
      }]
    )
    build_data = JSON.parse(build_response.body).first
    puts build_data.inspect
    build_data['data']['event'].should eq('info-mechanics')
    build_data['data']['why_not_applicable'].should eq('link_not_connected')

    # TODO: assertions
  end


end
