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

module ApplicationHelper

  def class_for(resource, name)
    unless resource.errors[name].blank?
      "input-container error"
    else
      "input-container"
    end
  end

  def login_error_message
    unless flash[:alert].blank?
      "<span class='error'>#{flash[:alert]}</span>".html_safe
    end
  end

  def error_message(resource, name)
    unless resource.errors[name].blank?
      "<span class='error'>#{name} #{resource.errors[name].join(', ')}</span>".html_safe
    else
      ""
    end
  end

end
