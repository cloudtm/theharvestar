require 'spec_helper'
require 'torquespec'

describe "Game" do
  app = <<-DD_END.gsub(/^ {4}/,'')
application:
  root: #{File.dirname(__FILE__)}/../../app
DD_END

  deploy(app)


  before do
    #authenticate user
    user = User.create!(:email => "email@email.com",
                        :nickname => "testuser",
                        :password => "password",
                        :password_confirmation => "password")
    post_via_redirect user_session_path, 'user[email]' => user.email, 'user[password]' => user.password
  end

  describe "GET /game" do
    it "works! (now write some real specs)" do
      # Run the generator again with the --webrat flag if you want to use webrat methods/matchers
      #get root_path
      visit root_path
      response.status.should be(200)

    end
  end

  describe "domain must execute commands" do

    it "must not accept non existing actions!" do
      xhr :post, "/game", :agent => {:cmd => 'non_existing_action'}
      response.status.should eq(503) # Service Unavailable
    end

    it "it must create game!" do
      before_create = DataModel::Game.count
      xhr :post, "/game/execute", :agent => {:cmd => 'create_game', :name => 'test-game'}, :format => :json
      response.status.should eq(200) #ok
      # game count must increase
      DataModel::Game.count.should eq(before_create + 1)
      # check some data?
      data = JSON.parse(response.body).first["data"]
    end
  end

end
