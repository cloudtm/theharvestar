# Configure the TorqueBox Servlet-based session store.
# Provides for server-based, in-memory, cluster-compatible sessions
#if ENV['TORQUEBOX_APP_NAME']
  #Theharvestar::Application.config.session_store :torquebox_store
#else
  Theharvestar::Application.config.session_store :cookie_store, :key => '5e2645ef210a241f96b0c2b43e88898be257db84249e8f4dbea5af4a03688bb70a54b546cbb5977c54ba93e513a49a4feb683c36f81b221c166aeb008e56870c'
#end
