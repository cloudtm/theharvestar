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

# hack to set the current datamodel ... need improvements
#DataModel = Relational
DataModel = Cloudtm

# Configure Madmass gem
Madmass.setup do |config|
  # Configure Madmass in order to use the Active Record transaction adapter,
  # default is :"Madmass::Transaction::NoneAdapter".
  # You can also create your own adapter and pass it to the configuration
  # {"config.tx_adapter = :'Madmass::Transaction::ActiveRecordAdapter'" if @ar}
  if(DataModel == Cloudtm)
    config.tx_adapter = :"Madmass::Transaction::CloudTmAdapter"
  else
    config.tx_adapter = :"Madmass::Transaction::ActiveRecordAdapter"
  end

  config.perception_sender = :"Madmass::Comm::SockySender"
  Madmass::Utils::InstallConfig.init
end


if(DataModel == Cloudtm)
  begin
    require File.join(Rails.root, 'lib', 'cloud_tm', 'framework')

    # loading the Fenix Framework
    Madmass.logger.debug "[initializers/cloud_tm] Initializing Framework"
    CloudTm::Framework.init
  rescue Exception => ex
    Rails.logger.error "Cannot load Cloud-TM Framework: #{ex}"
    Rails.logger.error ex.backtrace.join("\n")

    Madmass.logger.error "*********** LOOKING FOR CAUSES ************"
    current = ex
    while current
      Madmass.logger.error("Inspecting cause: #{current.class} --  #{current.message}")
      Madmass.logger.error current.backtrace.join("\n")
      current = current.class.method_defined?(:cause) ? current.cause : nil
    end
  end
end
