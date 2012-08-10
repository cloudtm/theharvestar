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