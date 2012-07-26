// Game Namespace
/****************************************************/
var Game = Game || {}
/****************************************************/

Game.initialize = function(percept) {
  if($defined(window.INITIALIZED)){
    if(window.console){ console.warn("Trying to initialize the game more than once!"); }
    return;
  }

  INITIALIZED = true;

  /******* Setup singletons *********/
  CONFIG = Game.Config.getInstance(percept);         // Configurable parameters
  Core.init(CONFIG.coreConfig());
  HISTORY = Game.History.getInstance();
  SETTINGS = Game.Settings.getInstance(CONFIG.settings);
  // Starts the controller
  CLIENT = Game.Responder.getInstance();
  PRESENCE = Game.Presence.getInstance(percept.playing_users);
  SOCKY = Madmass.Socky.getInstance(CONFIG.wssServer);        // used for server => client communications
  PUSHER = Game.PusherSocket.getInstance(CONFIG.pusher);  // used for user presence
  // and all the other systems
  SOUND = Game.SoundSystem.getInstance();       // Sound System
  GAME = Game.GameController.getInstance();     // Creates the game controller
  AJAX = Core.Ajax.getInstance(CONFIG.server);  // Client <=> Server communications
  WORLD = Core.frame;                           // Every actor belongs to the world
  MAP = Game.Map.getInstance();                 // Where the game takes place
  GUI = Game.Gui.getInstance();                 // Game gui
  RPC = Game.Rpc.getInstance();                 // Contains all the server calls. It uses the messaging subsystem to make server calls.
  /**************** Game setup ******************/

  GUI.build();
  CLIENT.event("manage-state", percept);

};

