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
