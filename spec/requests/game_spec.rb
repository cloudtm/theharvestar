require 'spec_helper'

describe "Game" do
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
      get root_path
      response.status.should be(200)

    end
  end

  describe "domain must execute commands" do
    #deploy(app)
    it "must not accept non existing actions!" do
      xhr :post, "/game", :agent => {:cmd => 'non_existing_action'}
      response.status.should be(503) # Service Unavailable
    end

    it "it must create game!" do
      xhr :post, "/game", :agent => {:cmd => 'create_game'}, :format => :json
      response.status.should be(200) #ok
      JSON.parse(response.body).first["data"].should == { 'game' => 1 }
    end
  end

end
