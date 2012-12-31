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

class CreateSettlements < ActiveRecord::Migration
  def change
    create_table :settlements do |t|
      t.integer :level, :default => 1
      t.integer :x, :y
      t.references :player, :game
      t.timestamps
    end

    create_table :settlements_terrains, :id => false do |t|
      t.references :settlement, :terrain
    end

    add_index(:settlements_terrains, [:settlement_id, :terrain_id], :unique => true, :name => 'settlements_terrains_key')
    add_index(:settlements, :player_id)
  end
end
