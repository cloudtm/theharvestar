###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# Copyright (c) 2012 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Vicolo di Sant'Agata 16
# 00153 Rome, Italy
#
###############################################################################
###############################################################################


begin
  # hack to set the current datamodel ... need improvements
  #DataModel = Relational
  DataModel = Cloudtm

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
