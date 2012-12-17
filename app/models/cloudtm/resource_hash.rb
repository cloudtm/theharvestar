module Cloudtm
  class ResourceHash
    include CloudTm::Model

    def attributes_to_hash
      {
        :silicon => silicon,
        :titanium => titanium,
        :energy => energy,
        :water => water,
        :grain => grain
      }
    end

    def [](attribute)
      attributes_to_hash[attribute]
    end

    def []=(attribute, value)
      attributes_to_hash[attribute] = value
    end

    def each &block
      attributes_to_hash.each do |attr, value|
        block.call(attr, value)
      end
    end

    def select &block
      attributes_to_hash.select do |attr, value|
        block.call(attr, value)
      end
    end

  end
end