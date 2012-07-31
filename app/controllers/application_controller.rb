class ApplicationController < ActionController::Base
  protect_from_forgery
  helper Madmass::ApplicationHelper
  include Madmass::AuthenticationHelper

  before_filter :set_lang
  before_filter :check_beta_token

  # check that the session contains the token for the beta version
  def check_beta_token
    @user_enabled_for_beta = true
    return



    @user_enabled_for_beta = false
    if(session[:beta_token] and session[:beta_token] == BetaToken.token)
      @user_enabled_for_beta = true
    end
  end

  def set_lang
    I18n.locale = I18n.default_locale
    return
  end

end
