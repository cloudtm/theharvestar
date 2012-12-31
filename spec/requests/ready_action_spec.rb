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
      'auth_token' => @auth_token,
      'actions' => [{ 
        'agent' => { 
          'cmd' => 'create_game',
          'name' => 'test-ready-game'
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
    ready_data = JSON.parse(ready_response.body).first
    ready_data['data']['state'].should eq('joining')
    ready_data['data']['users'].first['state'].should eq('join')

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
    ready_data = JSON.parse(ready_response.body).first
    ready_data['data']['state'].should eq('playing')
  end


end
