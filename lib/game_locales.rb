  class GameLocales
  include Singleton

  # we will search for yaml locales only in this dir ignoring all the I18n load paths.
  LOCALES_ROOT = File.join(Rails.root, 'config', 'locales')

  class << self

    # Returns a subset of locales picked from the current language. You can select
    # what to include with one or more selections that specify a key path, like in js.
    # - selections: a string or an array of strings. Example
    #  'action.game' or ['action', 'tutorial'] ...
    #
    # 'action.game' extracts only translations['action']['game'] where translation is the
    # translation hash in current language [:en, :it,...]. ['action', 'tutorial'] extracts
    # translations['action'] and translations['tutorial'] merging them in the same result hash.
    # Note: the full keys path is left in the result
    def get(selections)
      result = {}
      # Pickup the locales for the current language
      locales = @translations[I18n.locale]
      selections = [selections] if(selections.is_a? String)

      selections.each do |selection|
        key_path = selection.split('.')
        next if key_path.length == 0

        result_pointer = result
        locales_pointer = locales
        key_path.each_index do |i|
          key = key_path[i]
          if(i < key_path.length - 1)
            result_pointer[key] ||= {}
            result_pointer = result_pointer[key]
            locales_pointer = locales_pointer[key]
          else
            result_pointer[key] = locales_pointer[key]
          end
        end
      end
      return result
    end

    private

    def init
      @translations = HashWithIndifferentAccess.new
      Dir[File.join(LOCALES_ROOT, '*.yml')].sort.each do |locale|
        @translations.update(File.open(locale) { |yf|  YAML::load(yf) })
      end
    end

  end

  # Initialize automatically (at constantize) the class object!
  init

end
