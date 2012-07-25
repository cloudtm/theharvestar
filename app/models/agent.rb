class Agent < ActiveRecord::Base
 include Madmass::Agent::Executor
  attr_accessible :status
end
