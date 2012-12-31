#!/usr/bin/ruby

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

# This script put in the header of all ruby source file in the project the license statement.
# The script read the header text from the file 'license_header.txt' placed in this same folder.

require 'find'
require 'fileutils'

def add_license_header(file)
	license_text = File.open(@license_header_file, 'r'){|source_file| source_file.read }
	original_text = File.open(file, 'r'){|source_file| source_file.read }
	File.open(file, 'w') do |source_file|
		#original_text = source_file.read
		source_file.write license_text + original_text
	end
end

@app_folder = File.join(File.dirname(__FILE__), '..')
@license_header_file = File.join(File.dirname(__FILE__), 'license_header.txt')

puts "serching for source code on #{@app_folder} ..."

Find.find(@app_folder) do |path|
	if path.match /\.rb$/
		puts "writing #{path} ..."	  
		add_license_header(path)
		Find.prune
	end
end

puts "finished."