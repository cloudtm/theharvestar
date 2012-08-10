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
  # very very quirck mode to set the current datamodel ... need improvements
  #DataModel = Relational
  DataModel = Cloudtm

  require File.join(Rails.root, 'lib', 'cloud_tm', 'framework')

  # loading the Fenix Framework
  CloudTm::Framework.init(
    :dml => 'theharvestar.dml',
    :conf => 'infinispanNoFile.xml',
    :framework => CloudTm::Config::Framework::OGM
  )
rescue Exception => ex
  Rails.logger.error "Cannot load Cloud-TM Framework: #{ex}"
  Rails.logger.error ex.backtrace.join("\n")
end
