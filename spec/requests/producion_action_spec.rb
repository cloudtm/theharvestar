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
    game_data = initialize_game(@auth_token, 'production')

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
