# This method permits to include gems in specific environments.
source "http://rubygems.torquebox.org"
source 'https://rubygems.org'
source "http://gems.github.com"

gem 'rails', '3.2.6'
gem 'jquery-rails'
gem "madmass", :git => "git://github.com/algorithmica/madmass.git"

# Bundle edge Rails instead:
# gem 'rails', :git => 'git://github.com/rails/rails.git'

#gem 'jruby-openssl'
gem 'json'

# Gems used only for assets and not required
# in production environments by default.
group :assets do
  gem 'sass-rails',   '~> 3.2.3'
  gem 'coffee-rails', '~> 3.2.1'

  # See https://github.com/sstephenson/execjs#readme for more supported runtimes
  gem 'therubyrhino'
  gem 'uglifier', '>= 1.0.3'
end

# Communication
#gem "socky-client", "0.4.3"
gem "socky-client-rails", "0.4.5"
gem "socky-server", "0.4.1"
gem "pusher"

# Other gems
gem 'nifty-generators'
gem "devise"
#gem 'omniauth'
#gem 'rdoc', ">= 3.5.3" # RDoc Documentation gem
gem 'state_machine' # State machine pattern
gem "aws-ses", "~> 0.4.4", :require => 'aws/ses'
gem 'will_paginate'
gem 'paperclip', "~> 2.3"

#gem 'activerecord-jdbcsqlite3-adapter'
#gem "jdbc-sqlite3"
gem "jdbc-mysql"
gem 'activerecord-jdbcmysql-adapter'
gem "activerecord-jdbc-adapter"

# Gems for all environments except torquebox
group :development, :test do
  #gem "socky-server", ">= 0.4.0"
  #gem 'mysql2', "< 0.3.0" #FIXME
  gem "chronic"
  #gem "mongrel"
  gem "packet", ">= 0.1.15"
  # Job scheduler for development: http://backgroundrb.rubyforge.org/
  gem 'backgroundrb-rails3', ">= 1.1.3", :require => 'backgroundrb'
  # Async jobs: https://github.com/collectiveidea/delayed_job
  gem 'delayed_job', "=2.1.4"
  gem "rspec-rails"
  gem 'torquespec', ">= 0.3.5"
  gem 'capybara'
#  gem 'akephalos'
  gem 'torquebox-server', "2.2.0"
end

group :test do
  gem 'ZenTest'
end

# Jruby + Torquebox specific gems
group :torquebox, :production do
  gem 'jruby-openssl', :platform => :jruby
#  gem 'newrelic_rpm'
  gem 'json-jruby'
end

# To use ActiveModel has_secure_password
# gem 'bcrypt-ruby', '~> 3.0.0'

# To use Jbuilder templates for JSON
# gem 'jbuilder'

# Use unicorn as the app server
# gem 'unicorn'

# Deploy with Capistrano
# gem 'capistrano'

# To use debugger
# gem 'ruby-debug'
