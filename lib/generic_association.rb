
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
      update_attribute(:agent_id, _player.getExternalId)
      @player = _player
    end

  end

end


