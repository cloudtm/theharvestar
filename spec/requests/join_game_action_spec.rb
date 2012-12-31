###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# TheHarvestar is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# TheHarvestar is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with TheHarvestar.  If not, see <http://www.gnu.org/licenses/>.
#
# Copyright (c) 2010-2013 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Largo Alfredo Oriani 12
# 00152 Rome, Italy
#
###############################################################################
###############################################################################

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
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => {
          'cmd' => 'join_game',
          'game_id' => nil,
          'slot' => 2
        }
      }]
    )
    json_data = JSON.parse(join_game_response.body).first
    json_data['status']['code'].should eq('precondition_failed')
    json_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    json_data['data']['why_not_applicable'].should eq('game_not_exist')
  end

  it "should join in a game" do
    create_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'create_game',
          'name' => 'test-join-game'
        }
      }]
    )
    game_data = JSON.parse(create_game_response.body).first

    # slot already taken
    join_game_response = invoke_remote_action(
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => {
          'cmd' => 'join_game',
          'game_id' => game_data['data']['id'],
          'slot' => 1
        }
      }]
    )
    json_data = JSON.parse(join_game_response.body).first
    json_data['status']['code'].should eq('precondition_failed')
    json_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    json_data['data']['why_not_applicable'].should eq('slot_taken')

    # join all users
    2.upto(GameOptions.options(:base)[:max_player_limit]) do |index|
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
      join_data = JSON.parse(join_game_response.body).first
      join_data['status']['code'].should eq('ok')
      join_data['data']['users'].first['nickname'].should eq("nick-#{index}")
      join_data['data']['users'].first['state'].should eq('join')

      if index >= GameOptions.options(:base)[:min_player_limit]
        join_data['data']['state'].should eq('armed')
      end
    end

    # verify that the game is full
    extra_index = GameOptions.options(:base)[:max_player_limit] + 1
    auth_token = signin_with('email' => "test-user-#{extra_index}@email.com", 'password' => 'password')
    join_game_response = invoke_remote_action(
      'auth_token' => auth_token,
      'actions' => [{ 
        'agent' => {
          'cmd' => 'join_game',
          'game_id' => game_data['data']['id'],
          'slot' => extra_index
        }
      }]
    )
    join_datas = JSON.parse(join_game_response.body)
    join_data = join_datas.first
    join_data['status']['code'].should eq('precondition_failed')
    join_data['status']['exception'].should eq('Madmass::Errors::NotApplicableError')
    join_data['data']['why_not_applicable'].should eq('game_full')
  end
end
