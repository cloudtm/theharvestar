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

# Monkey Patch for "Module is not missing constant Class"
#module ActiveSupport
#  module Dependencies
#    extend self
#    
#    def load_missing_constant_with_reload( from_mod, const_name )
#      begin
#        load_missing_constant_without_reload(from_mod, const_name)
#      rescue NameError => arg_err
#        Rails.logger.error "ALURA????????????? #{arg_err.message}"
#        Rails.logger.error "SEARCHING FOR: #{from_mod} is not missing constant #{const_name}!"
#        if arg_err.message == "#{from_mod} is not missing constant #{const_name}!"
#          return from_mod.const_get(const_name)
#        else
#          raise
#        end
#      end
#    end
#
#    alias_method_chain :load_missing_constant, :reload
#  end
#end