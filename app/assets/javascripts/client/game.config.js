/***************************************************************************
                       Configuration singleton
***************************************************************************/
/* This class contains both configuration vairables and functions that
 * prepare ready to use sets. */
Game.Config = new Class.Singleton({
  initialize: function(percept){
    this.userId = percept.user_id;
    this.debugging = Game.config.debugging;  // This function is defined in the layout and its return value changes among rails environments
    this.fps = 30;
    jQuery.fx.interval = (1000 / this.fps).round();

    this.popups = true;   // activate or deactivate popups. It can be changed at runtime.

    this.geoIpService = "http://smart-ip.net/geoip-json?callback=?";
    this.tabAlertSpeed = 1000;
    /********************************************************************************/
    // Adds game options and locale translations jsoned from server
    this.gameOptions = percept.game_options;
    this.gameLocales = percept.game_locales;

    /********************************************************************************/
    // User custom client settings
    this.saveSettings = true; // tells if the settings should be saved on the server or not.
    this.defaultSettings = {
      audio: {
        volume: {fx: 100, music: 100}
      },
      hiscores: {
        size: 10
      },
      gui: {
        presence: {
          open: true,
          entries: 20
        }
      }
    };
    this.settings = $H(JSON.parse(percept.settings || "{}")).combine(this.defaultSettings).getClean();

    /********************************************************************************/
    // Avatars
    this.avatars = ['starr','titanya','vassern','gaezar','sylva','silee','raider'];
    this.avatarsInfo = {
      dim: {w: 235, h: 456},
      starr: {name: 'Capt. Harvey Starr', looks: 'left'},
      titanya: {name: 'Titanya', looks: 'left'},
      vassern: {name: 'Vassern', looks: 'left'},
      gaezar: {name: 'Steam Gaezar', looks: 'left'},
      sylva: {name: 'Sylva Treehugger', looks: 'left'},
      silee: {name: 'Silee Kohn', looks: 'left'},
      raider: {name: 'Raider', looks: 'left'},
    }

    /********************************************************************************/
    // Graphics configuration
    this.tileRadius = 53.7;
    this.mapCenterX = 378;
    this.mapCenterY = 283;
    this.drawSea = false;
    this.tileDx = 1.5 * this.tileRadius;
    this.tileDy = Math.sin(Math.PI/3) * this.tileRadius;

    this.terrainSize = {w: 100, h: 128}; // size of the terrain tile. Must match the css.
    this.baseSize = {w: 51, h: 68} // size of bases (outposts and stations). Must match the css.
    this.linkSize = { // size of links. Must match the css.
      ver: {w: 35, h: 52},  // roads with vertical orientation (y axis in map coordinates)
      hor: {w: 35, h: 52},  // roads with horizontal orientation (x axis in map coordinates)
      rot: {w: 59, h: 14}   // roads with tilted orientation (y and y axis in map coordinates)
    };
    
    /********************************************************************************/
    /* Buildings upgrades (used in css classes and rpc commands). */
    this.baseUpgrades = ['none', 'outpost', 'station'];
    this.linkUpgrades = ['none', 'link'];
    this.unbuildable = 'unbuildable'; // Special scope for unbuildable node

    /********************************************************************************/
    // Resources map
    this.resources = $H({
      desert: 'desert',
      volcano: 'silicon',
      mountain: 'titanium',
      cyclon: 'energy',
      lake: 'water',
      field: 'grain',
      sea: 'sea',
      recycle: 'recycle'  // this resource is generate by the R&D
    }); // css name mapping
    this.unproductive = ['desert', 'sea', 'recycle'];  // unproductive terrains
    this.raidersTerrain = "desert";  // terrain that belongs to raiders
    
    /********************************************************************************/
    // Research map
    this.labStoreEntries = $H({
      social: 'social',       // number of boycots
      recycle: 'recycle',     // number of recycle matter
      transport: 'transport', // number of free links
      outposts: 'outposts',   // number of free outposts
      stations: 'stations'    // number of free stations
    }); // mapping between server and client name : hash keys stand for client names, value names for server names

    this.redHistoryEntries = $H({
      social_level: 'social_level',       // total number of obtained boycots
      cultural_level:'cultural_level',    // number of universities
      recycle_level: 'recycle_level',     // total number of obtained recycle ?
      transport_level: 'transport_level'  // longest road
    }); // mapping between server and client name : hash keys stand for client names, value names for server names

    /********************************************************************************/
    // Server params
    var domain = window.location.host.split(':');
    this.server = {
      host: domain[0],
      port: domain[1],
      controller: 'game',
      watchedStatuses: [401, 500]   // these statuses are notified with a $msg.sys.netStatus message
    };

    // socky params
    var wss = Game.config.wssServer;
    this.wssServer = {
      host: (wss.secure ? "wss://" : "ws://") + wss.host,
      port: wss.port,
      clientChannel: percept.user_id,
      listChannel: 'list'
      // join and play channel is the game id
      // client channel is the user id
    };

    // pusher params
    // ref: http://pusher.com/docs/client_api_guide/client_connect
    this.pusher = {
      key: Game.config.pusherKey,
      options: {encrypted: false},
      presence: {                           // presence channel configuration
        channel: (Game.config.env == 'development' ? "presence-users-dev" : "presence-users"),
        stateEvent: "client-state-change"  // events (on presence channel) for the user state change
      },
      user: {
        prefix: (Game.config.env == 'development' ? "private-dev-user-" : "private-user-"),
        channel: (Game.config.env == 'development' ? "private-dev-user-" + this.userId : "private-user-" + this.userId),
        event: "client-user-event"
      }
    }

    /********************************************************************************/
    // Sharing services. References:
    // http://support.addthis.com/customer/portal/articles/381263-addthis-client-api#rendering-decoration
    // http://www.addthis.com/services/list#.T2s9j_Dj7kk
    // For Google Analytics integration see: http://support.addthis.com/customer/portal/articles/381260-google-analytics-integration#.T2tLc_Dj6ts
    this.share = {
      config: {
        ui_open_windows: true
      },
      services: ['facebook', 'twitter', 'google_plusone'],
      bigButtons: true  //32x32
    };
  },
  
  /********************************************************************************/
  // Dynamic parameters
  /********************************************************************************/
  
  // Returns the configuration for the Core initialization
  coreConfig: function(){
    return $H(this.debugging).extend({fps: this.fps});
  },

  /* Returns a motools hash for the current resources with all values at 0 (es: {titanium:0, energy:0,...}). */
  resourceSet: function(){
    var emptySet = new Hash;
    var currentResources = this.resources.getValues();
    currentResources.each(function(resource){
      if(!this.unproductive.contains(resource)){
        emptySet.set(resource, 0);
      }
    }, this);

    return emptySet;
  },

  /* Returns a motools hash for the current lab store entries with all values at 0 (es: {social:0, recycle:0,...}). */
  labStoreSet: function(){
    var emptySet = new Hash;
    var currentStore = this.labStoreEntries.getValues();
    currentStore.each(function(entry){
      emptySet.set(entry, 0);
    }, this);

    return emptySet;
  },


  /* Returns a motools hash for the current lab store entries with all values at 0 (es: {social:0, recycle:0,...}). */
  redHistorySet: function(){
    var emptySet = new Hash;
    var currentStory = this.redHistoryEntries.getValues();
    currentStory.each(function(entry){
      emptySet.set(entry, 0);
    }, this);

    return emptySet;
  },

  /* Retrieves the translated message for key, where key is a dot separated key path
   * like "action.city.not_legal"
   * - message: {key: 'key.string' [, subs: { substitutions hash} ] }   */
  translation: function(message){
    var keyPath = message.key.split('.');
    node = this.gameLocales;
    keyPath.each(function(key){ node = node[key]; }, this);
    if($type(node) != "string"){
      $log("Translation for '" + message.key + "' not found!", {level: "warn"});
      node = "No translation found";
    }
    return (node.replace(/%{/g, "{").substitute(message.subs));
  }
});