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

class AddGvisionColumnsToUser < ActiveRecord::Migration
  def change

    change_table :users do |t|
      t.string :last_name
      t.string :first_name
      t.string :nickname
      t.string :gender
      t.integer :score, :default => 0
      t.string :state, :default => "list"
      t.string :picture_file_name
      t.string :picture_content_type
      t.integer :picture_file_size
      t.datetime :picture_updated_at
      t.string :language
      t.date :birthday
      t.string :country
      t.text :settings
      t.string :role, :default => "simple player"
      t.string :preview_file_name
      t.string :preview_content_type
      t.integer :preview_file_size
      t.datetime :preview_updated_at
    end

  end
end
