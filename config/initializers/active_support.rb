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