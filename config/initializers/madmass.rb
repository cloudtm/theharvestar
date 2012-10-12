  Madmass.setup do |config|
    # Configure Madmass in order to use the Active Record transaction adapter,
    # default is :"Madmass::Transaction::NoneAdapter".
    # You can also create your own adapter and pass it to the configuration
    # {"config.tx_adapter = :'Madmass::Transaction::ActiveRecordAdapter'" if @ar}

    # Configure Madmass to use
    #config.tx_adapter = :"Madmass::Transaction::ActiveRecordAdapter"
    #config.tx_adapter = :"Madmass::Transaction::TorqueBoxAdapter"
    config.tx_adapter = :'Madmass::Transaction::CloudTmAdapter'
    config.perception_sender = :"Madmass::Comm::SockySender"
    #config.domain_updater = :"MapUpdater"
    Madmass::Utils::InstallConfig.init
 end
