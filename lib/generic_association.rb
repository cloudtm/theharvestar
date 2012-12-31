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


module GenericAssociation

  def self.included klass
    klass.class_eval do
      extend ClassMethods
    end
  end

  module ClassMethods
    def associate_with_agent(klass)
      if klass.superclass == ActiveRecord::Base
        extend ActiveRecordClassMethods
      else
        extend CloudTmClassMethods
      end

      associate_with(klass)
    end
  end

  module ActiveRecordClassMethods
    def associate_with(klass)
      has_one :player, :class_name => klass
    end
  end

  module CloudTmClassMethods
    def associate_with(klass)
      class_eval do
        include GenericAssociation::CloudTmInstanceMethods
      end
    end
  end

  module CloudTmInstanceMethods
    # TODO: to check
    def player
      pl = DataModel::Player.find_by_id agent_id
      @player ||= pl
    end

    def player=(pl)
      update_attribute(:agent_id, pl.getExternalId)
      @player = pl
    end

    def create_player!
      _player = DataModel::Player.create :user_id => self.id
      update_attributes(:agent_id => _player.getExternalId)
      @player = _player
    end

  end

end


