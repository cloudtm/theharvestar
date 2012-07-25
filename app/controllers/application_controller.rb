class ApplicationController < ActionController::Base
  protect_from_forgery
  helper Madmass::ApplicationHelper
  include Madmass::AuthenticationHelper
end
