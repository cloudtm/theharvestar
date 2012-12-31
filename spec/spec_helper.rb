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

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'rspec/autorun'
require 'torquespec'

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each {|f| require f}


TorqueSpec.local {
  require 'capybara/dsl'

#  require 'akephalos'
#  Capybara.register_driver :akephalos do |app|
#    Capybara::Driver::Akephalos.new(app, :browser => :firefox_3)
#  end
#  Capybara.default_driver = :akephalos

  Capybara.app_host = "http://localhost:8080"
  Capybara.run_server = false
#Capybara.default_driver = :selenium

  RSpec.configure do |config|
    config.include Capybara::DSL
    config.after do
      Capybara.reset_sessions!
    end
  end
}

#RSpec.configure do |config|
# ## Mock Framework
#
# If you prefer to use mocha, flexmock or RR, uncomment the appropriate line:
#
# config.mock_with :mocha
# config.mock_with :flexmock
# config.mock_with :rr

# Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
#  config.fixture_path = "#{::Rails.root}/spec/fixtures"

# If you're not using ActiveRecord, or you'd prefer not to run each of your
# examples within a transaction, remove the following line or assign false
# instead of true.
#  config.use_transactional_fixtures = true

# If true, the base class of anonymous controllers will be inferred
# automatically. This will be the default behavior in future versions of
# rspec-rails.
#  config.infer_base_class_for_anonymous_controllers = false

# Run specs in random order to surface order dependencies. If you find an
# order dependency and want to debug it, you can fix the order by providing
# the seed, which is printed after each run.
#     --seed 1234
#  config.order = "random"
#end


def invoke_remote_action(params)
  http = Net::HTTP.new('localhost', '8080').start
  remote_request = Net::HTTP::Post.new('/game/execute.json', initheader = {'Content-Type' => 'application/x-www-form-urlencoded'})
  params['actions'] = params['actions'].to_json
  remote_request.body = params.to_query
  http.request(remote_request)
end

def signin_with(params)
  http = Net::HTTP.new('localhost', '8080').start
  signin_request = Net::HTTP::Post.new('/api/v1/tokens.json', initheader = {'Content-Type' => 'application/x-www-form-urlencoded'})
  signin_request.body = params.to_query
  signin_response = http.request(signin_request)
  JSON.parse(signin_response.body)['token']
end

def initialize_game(auth_token, step = nil)
  # there is a minimum number of players that can start a game
  create_game_response = invoke_remote_action(
    'auth_token' => auth_token,
    'actions' => [{ 
      'agent' => { 
        'cmd' => 'create_game',
        'name' => "test#{step ? '-'+step : ''}-game"
      }
    }]
  )
  game_data = JSON.parse(create_game_response.body).first
  
  ready_response = invoke_remote_action(
    'auth_token' => auth_token,
    'actions' => [{ 
      'agent' => { 'cmd' => 'ready' }
    }]
  )

  # join other users to the game
  2.upto(GameOptions.options(:base)[:min_player_limit]) do |index|
    new_auth_token = signin_with('email' => "test-user-#{index}@email.com", 'password' => 'password')

    join_game_response = invoke_remote_action(
      'auth_token' => new_auth_token,
      'actions' => [{ 
        'agent' => {
          'cmd' => 'join_game',
          'game_id' => game_data['data']['id'],
          'slot' => index
        }
      }]
    )
    ready_response = invoke_remote_action(
      'auth_token' => new_auth_token,
      'actions' => [{ 
        'agent' => { 'cmd' => 'ready' }
        }]
    )

  end

  # the game should start playing
  play_game_response = invoke_remote_action(
    'auth_token' => auth_token,
    'actions' => [{ 
      'agent' => { 'cmd' => 'play' }
      }]
  )

  return game_data
end
