/*********************************************************************
 *                            GAME GAME
 *********************************************************************/
Game.GameController = new Class.Singleton({
  Extends: Core.Base,
  Implements: Core.Dispatchable,
  name: "GameController",

  loading: false,           // See play function for an explanation
  //-------------------------------------------

  initialize: function(){
    $log("Game.GameState: initializing...", {section: 'open'});
    this.parent();

    this.machine = new Core.FSM;
    this.machine
      .addState({name: 'reload'})
      .addState({name: 'list', enter: this.enterState.bind(this)})
      .addState({name: 'join', enter: this.enterState.bind(this)})
      .addState({name: 'play', enter: this.enterState.bind(this)})
      .addState({name: 'end', enter: this.enterState.bind(this)})
      .addState({name: 'hiscores', enter: this.enterState.bind(this)})
      .addState({name: 'account', enter: this.enterState.bind(this)})

      // Startup events that loads the page
      .addTransition({from: 'reload', to: 'list', event: 'list', doing: this.onTransition.bind(this)})
      .addTransition({from: 'reload', to: 'join', event: 'join', doing: this.onTransition.bind(this)})
      .addTransition({from: 'reload', to: 'play', event: 'play', doing: this.onTransition.bind(this)})
      .addTransition({from: 'reload', to: 'end', event: 'end', doing: this.onTransition.bind(this)})

      // Transitions events when the game is already loaded
      .addTransition({from: 'list', to: 'join', event: 'join', doing: this.onTransition.bind(this)}) // join/create
      .addTransition({from: 'list', to: 'play', event: 'play', doing: this.onTransition.bind(this)}) // demo: percepet is the game
      .addTransition({from: 'join', to: 'play', event: 'play', doing: this.onTransition.bind(this)}) // all ready: percepet is the game
      .addTransition({from: 'join', to: 'list', event: 'list', doing: this.onTransition.bind(this)}) // game left: percepet is the game list
      .addTransition({from: 'play', to: 'list', event: 'list', doing: this.onTransition.bind(this)}) // game left => summary: percept is the game list
      .addTransition({from: 'play', to: 'end', event: 'end', doing: this.onTransition.bind(this)})   // game ended => summary: percept is the summary
      .addTransition({from: 'end', to: 'list', event: 'list', doing: this.onTransition.bind(this)}) // when closing ended: percept is the game list

      // Hall of fame <=> list <=> account transitions
      .addTransition({from: 'list', to: 'hiscores', event: 'hiscores', doing: this.onTransition.bind(this)})
      .addTransition({from: 'hiscores', to: 'list', event: 'list', doing: this.onTransition.bind(this)})
      .addTransition({from: 'list', to: 'account', event: 'account', doing: this.onTransition.bind(this)})
      .addTransition({from: 'account', to: 'list', event: 'list', doing: this.onTransition.bind(this)})
      .addTransition({from: 'hiscores', to: 'account', event: 'account', doing: this.onTransition.bind(this)})
      .addTransition({from: 'account', to: 'hiscores', event: 'hiscores', doing: this.onTransition.bind(this)});

    this.gui = null;  // Assigned dynamically on enter state to current viewport -> .gui
    this.state = this.machine.state;  // Used to assign the current state to the body as class
    this.playStop(); // Initializes game variables

    // Gets geo information about the user
    (function(self){$.getJSON(CONFIG.geoIpService, function(data){self.geo = data;});})(this);

    this.playingMessages = [
      $msg.update.player,
      $msg.update.game
    ];

    this.mapReceivers([
      {map: $msg.update.player, to: this.receivePlayer},
      {map: $msg.update.game, to: this.receiveGame},
      {map: $msg.sys.netStatus, to: this.netResponse},
      {map: $msg.info.tabAlert, to: this.tabAlert}
    ]);
    this.listen([$msg.sys.netStatus, $msg.info.tabAlert]);

    $log("Game.GameState: OK", {section: 'close'});
  },

  /**************************************************************************************/
  // States management

  // transitions is like: "list => play"
  onTransition: function(transition, percept){
    var channels;
    $log('State transition: ' + transition);
    switch(transition){
      case 'list => join':  // created or joined game
        $send($msg.update.joinGame, percept);
        SOCKY.subscribe(['list', 'game_' + percept.id]);
        break;

      case 'join => list':  // I left a game
        $send($msg.update.unjoinGame, percept);
        SOCKY.subscribe(['list']);
        break;

      case 'join => play':
      case 'list => play':
        this.listStop();
        $("#list").hide();
        $("#play").show();
        this.gui = $("#play-gui");
        this.playStart(percept);
        SOCKY.subscribe(['game_' + percept.id]);
        break;

      case 'play => end':
        this.send($msg.info.summary, percept);
        this.send($msg.info.gameEnded);
        this.unlisten(this.playingMessages);
        break;

      /* Manage leaves game *****************************************/
      case 'play => list':
      case 'end => list':
        this.playStop();
        $("#play").hide();
        $("#list").show();
        this.gui = $("#list-gui");
        this.listStart(percept);
        SOCKY.subscribe(['list']);
        this.unlisten(this.playingMessages);
        break;

      /* Manage hiscores & account **************************************/
      case 'list => hiscores':
        this.listStop();
        $("#list").hide();
        $("#hiscores").show();
        this.gui = $("#hiscores-gui");
        this.hiscoresStart(percept);
        SOCKY.subscribe();
        break;
      case 'hiscores => list':
        this.hiscoresStop();
        $("#hiscores").hide();
        $("#list").show();
        this.gui = $("#list-gui");
        this.listStart(percept);
        SOCKY.subscribe(['list']);
        break;
      case 'list => account':
        this.listStop();
        $("#list").hide();
        $("#account").show();
        this.gui = $("#account-gui");
        this.accountStart(percept);
        SOCKY.subscribe();
        break;
      case 'account => list':
        this.accountStop();
        $("#account").hide();
        $("#list").show();
        this.gui = $("#list-gui");
        this.listStart(percept);
        SOCKY.subscribe(['list']);
        break;
      case 'hiscores => account':
        this.hiscoresStop();
        $("#hiscores").hide();
        $("#account").show();
        this.gui = $("#account-gui");
        this.accountStart(percept);
        break;
      case 'account => hiscores':
        this.accountStop();
        $("#account").hide();
        $("#hiscores").show();
        this.gui = $("#hiscores-gui");
        this.hiscoresStart(percept);
        break;

      /* Manage RELOADS ********************************************/
      case 'reload => list':
        channels = ['list'];
      case 'reload => join':
        channels = channels || ['list', 'game_' + percept.id];
        $("#list").show();
        this.gui = $("#list-gui");
        this.listStart(percept);
        SOCKY.subscribe(channels);
        break;

      case 'reload => play':
        $("#play").show();
        this.gui = $("#play-gui");
        this.playStart(percept);
        SOCKY.subscribe(['game_' + percept.id]);
        break;

      case 'reload => end':
        $("#play").show();
        this.gui = $("#play-gui");
        this.playStart(percept);
        $send($msg.info.summary, percept);
        $send($msg.info.gameEnded);
        this.unlisten(this.playingMessages);
        SOCKY.subscribe(['game_' + percept.id]);
        break;
    }
  },

  enterState: function(state, percept){
    $log('Game state changed to: ' + state);
    WORLD.element.removeClass(this.state);
    WORLD.element.addClass(state);
    this.state = state;
    $send($msg.info.newState, state);
  },

  /**************************************************************************************/
  // HISCORES functions
  /**************************************************************************************/

  hiscoresStart: function(percept){
    $send($msg.audio.music, $music.hiscores);
    $send($msg.info.hiscoresStart, percept.scores);
  },

  hiscoresStop: function(){
    $send($msg.info.hiscoresStop);
  },

  /**************************************************************************************/
  // ACCOUNT functions
  /**************************************************************************************/

  accountStart: function(percept){
    $send($msg.audio.music, $music.hiscores);
    $send($msg.info.accountStart, percept.account)
  },

  accountStop: function(){
    $send($msg.info.accountStop);
  },

  /**************************************************************************************/
  // LIST functions
  /**************************************************************************************/

  listStart: function(percept){
    percept.games_list.each(function(game){
      $send($msg.update.joinGame, game);
    });

    //$send($msg.audio.music, $music.list);
    $send($msg.info.listStart);
  },

  listStop: function(){
    $send($msg.info.listStop);
  },

  /**************************************************************************************/
  // PLAY functions
  /**************************************************************************************/

  playStop: function(){
    /**** State variables **********************************************/
    this.resetting = true;

    // Players info
    this.pid = null;      // This player id
    this.pids = [];       // Tha array of player ids
    /* players will be populated like this:
     * {15: {
     *    id: 15,             // Player id (server side id)
     *    player:1,           // player ordinal (1..4)
     *    name: 'UserName',   // user name
     *    image: imageUrl,    // image url for the player
     *    score: 10,          // raw score
     *    power: {level..}    // user level informations (level, percentage, range, progress)
     *    map: {stations: 0, outposts: 1, links: 1}  // map info
     * } where 15 is the pid, id is the player ordinal */
    this.players = new Hash;
    this.player = null;   // A shortcut to player ordinal (this.players[this.pid].player).
    this.me = null;       // A shortcut to my info (this.players[this.pid])

    this.totalScore = 0;  // Player game score
    this.resources = null;  // Player resources ( {titanium: 4, energy: 8, ...} }. Includes recycled matter.
    this.labStore = null;   // available player progresses ({social: 3, recycle: 4, transport: 1})
    this.bonuses = null;
    this.redHistory = null; // available player progresses ({social_level: 3, recycle_level: 4,cultural_level:2, transport_level: 1})
    this.challanges = {     // Awards
      transport: { leader: 0, count: 0 },
      social: { leader: 0, count: 0 }
    };

    this.stats = {
      production: {}
    };

    Game.Versioning.reset();
    $send($msg.info.playStop);

    this.resetting = false;
    return true;
  },

  /* Init game state (terrains, infrastructures, player state and market)
   * game: json data passed by the server. */
  playStart: function(game){
    $log("Game.GameState: loading game...", {section: 'open'});
    /* Everyone who receive messages can inspect GAME.loading to know if the message
     * is generated by a load process (loading or reloading) */
    this.loading = true;

    this.resources = CONFIG.resourceSet();
    this.resources.set(CONFIG.labStoreEntries.recycle, 0); // adds recycled to resources
    this.labStore = CONFIG.labStoreSet();
    this.redHistory = CONFIG.redHistorySet();

    // Adds bonuses
    this.bonuses = {
      links: CONFIG.gameOptions.init_roads,
      outposts: CONFIG.gameOptions.init_settlements
    };

    // Init player state
    this.setupPlayers(game.players_info);

    // Updates the player data if the players[0] is me .Happens when reloading
    // and for the user that clicked ready last. What we really need is the reloading.
    var player = game.players[0];
    if(player.id == this.pid){ this.updatePlayer(player) };

    $log("Loaded players.");
    this.updateAwards(game);
    $log("Loaded awards.");

    // Starts the background music
    $send($msg.audio.music, $music.play)
    $send($msg.info.playStart, game);   // Sends a game start message

    this.loading = false;       // End of loading process
    this.listen(this.playingMessages);

    $log("Game.GameState: game loaded.", {section: 'close'});
  },

  setupPlayers: function(playerInfos){
    // Pushes data into pids array and store player information
    playerInfos.each(function(player){
      player['power'] = Game.Helpers.userLevel(player.score);
      player['map'] = {stations: 0, outposts: 0, links: 0};
      var pid = parseInt(player.id);
      this.pids.push(pid);
      this.players.set(pid, player);
      if(player.user == CONFIG.userId){
        this.pid = pid;
        this.me = player;
        this.player = player.slot;
      }
    }, this);
    $log("Built player infos.");
  },

  updatePlayer: function(player){
    var updated = {resources: false, score: false, lab: false, red: false, bonuses: false};
    var recylced = CONFIG.labStoreEntries.recycle; // get recycled matter name for later use

    /*************************************************************************************/
    // RESOURCES
    // Updates state ------------------------------------
    /* I can not use hash extend method for the resources because they are
     * in the player hash with other states properties */
    if($defined(player[CONFIG.resources.lake])){  // Check for the presence of one of the possible resource
      this.resources.each(function(count, resource){
        var count = player[resource];
        if($defined(count)){ this.resources.set(resource, count); }  // count is not defined for "recycle" as it's got from red_lab
      }, this);
      updated.resources = true;
    }

    /*************************************************************************************/
    // LAB
    // Updates lab store and merges recyled matter into resources.
    var lab = player.red_lab;
    if(lab){
      this.labStore.each(function(count, store){
        var labCount = lab[store];
        if($defined(labCount)){ this.labStore.set(store, labCount); }  // Check for $defined as client lab store is "bigger" than server one :)
        if(store == recylced) this.resources.set(recylced, labCount);
      }, this);
      updated.lab = true;
      updated.resources = true;
    }

    /*************************************************************************************/
    // RED
    // Updates the research history (contains university)
    var red = player.red_history;
    if(red){
      this.redHistory.getKeys().each(function(historyItem){
        this.redHistory.set(historyItem, red[historyItem]);
      }, this);
      updated.red = true;
    }

    /*************************************************************************************/
    // SCORE
    // Updates the game score
    if($defined(player.total_score)){
      this.totalScore = player.total_score;
      updated.score = true;
    }

    /*************************************************************************************/
    // BONUSES
    // Updates the player bonuses
    if(player.bonuses){
      this.bonuses.links = player.bonuses.links;
      this.bonuses.outposts = player.bonuses.outposts;
      updated.bonuses = true;
    }

    return updated;
  },

  updateAwards: function(game){
    var leader;
    if(game.transport_leader_id > 0){
      leader = this.players[game.transport_leader_id];
      this.challanges.transport.leader = leader ? leader.slot : 0;
    }
    this.challanges.transport.count = game.transport_count;

    if(game.social_leader_id > 0){
      leader = this.players[game.social_leader_id];
      this.challanges.social.leader = leader ? leader.slot : 0;
    }
    this.challanges.social.count = game.social_count;
  },

  /************* MESSAGE RECEIVERS **********************************************************/

  /* Receives player state:
   * - resources: {resource: quantity, ...} where
   *   : resource is one of: ore, clay, wood, wool, grain
   *   : quantity is the total resources of that type owned by the player.
   *     It's not an incremental value.
   * - score: integer representing player score
   * - cards: to be defined.
   *
   * Note that not all resources are required in the hash, only the resources with updated values.
   **/
  receivePlayer: function(player){
    var updated = this.updatePlayer(player);
    
    // Sends messages to the GUI ------------------------
    if(updated.resources){ $send($msg.info.resources, GAME.resources); }
    if(updated.score){ $send($msg.info.score, this.totalScore); }
    if(updated.lab){ $send($msg.info.labStore, GAME.labStore); }
    if(updated.red){ $send($msg.info.redHistory, GAME.redHistory); }
    return true;
  },

  /* Called by server to update public game state:
   * - infrastructures
   * - challanges
   **/
  receiveGame: function(game){
    if(game.infrastructures){
      $send($msg.update.infrastructures, game.infrastructures);
    }
    this.updateAwards(game);
    $send($msg.info.challanges, this.challanges);
    return true;
  },

  /**************************************************************************************/
  // OTHER functions
  /**************************************************************************************/

  netResponse: function(code){
    switch(code){
      case 401:
        alert("Session expired. You will be redirected to login.");
        window.location = "http://" + window.location.host;
        break;
      case 500:
        alert("Server failure! Please contact the administrators.");
        break;
    }
  },

  // Alert on browser tab
  // - data: {text: '...' [, priority: N >=0]}
  tabAlert :function(data){
    // doc: https://github.com/heyman/jquery-titlealert
    $.titleAlert(data.text, {
      requireBlur: true,
      stopOnFocus: true,
      duration: 0,
      priority: data.priority,
      interval: CONFIG.tabAlertSpeed
    });
  },

  /**************************************************************************************/
  event: function(name, options){
    this.machine.event(name, options);
  },

  /**************************************************************************************/
  // Object inspection function
  /**************************************************************************************/

  toJSON: function(){
    var inspect = "";
    for(var key in this){
      if(this.hasOwnProperty(key) && $type(this[key]) != "function"){
        inspect += ", " + key + ": " + JSON.stringify(this[key]).replace(/"/g, "'");
      }
    }
    inspect += ", players:" + JSON.stringify(this.players).replace(/"/g, "'");
    return(this.parent() + inspect);
  }

});

