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

# This module adds a model the ability to manage their own changes with a version control mechanism.
# The history of changes of the model is not stored, this mechanism is used only to let the presentation layer
# to mamnage the proper order of the changes that are sent from the server.
# To use it the model must have a column called "version" of type integer.
# Every action that needs to notify a change in a model can call the "changed!" method injected
# to the model by this module.
module Relational
  module Versionable
    # Increment the version in memory and on db.
    def increase_version!
      update_attribute(:updated_at, Time.now)
      #save
    end
  end
end