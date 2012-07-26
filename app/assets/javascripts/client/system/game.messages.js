/* Gamecore mini js library for js game programming
 * Based on moo4q (mootools for jQuery)
 * © Algorithmica 2010
 */

/*********************************************************************
 *                  Game dispatch events (message ids)
 *********************************************************************/
// NOTE: we use numebrs as message ids ($newMsgId() returns numbers)

Game.Messages = {
  /*******************************************************************/
  // System messages
  sys: {
    netStatus: $newMsgId()      // Network response status code. Data: code (401, 500,...)
  },

  /*******************************************************************/
  // Messages to the client
  client: {
    event: $newMsgId()      // an event notified to the client (from the server or other client) data: {type: 'eventType', ... event dependant ...}
  },

  /*******************************************************************/
  /* Notification messages, their purpose is just to notify
   * events but don't have any gameplay impact. */
  info: {
    production: $newMsgId(),   // data: producing terrains [[0,0],[1,0],...]
    raid: $newMsgId(),         // data: raided terrains [[0,0],[1,0],...] (! only 1 for now !)
    resources: $newMsgId(),    // data: resources hash {ore: 3, ..}
    score: $newMsgId(),        // data: score number
    challanges: $newMsgId(),   // data: {transport: [leader player, score count], social: [leader player, score count]}
    summary: $newMsgId(),      // data: game with summary hash (end game info)
    summaryLeaved: $newMsgId(),// data: user id that leaved from summary
    labStore: $newMsgId(),     // data: {social: 3, recycle: 4, transport: 1} => available bonuses
    redHistory: $newMsgId(),   // data: {social: 3, cultural: 5, recycle: 2, transport: 2} => history of bonuses
    chat: $newMsgId(),         //
    syscmd: $newMsgId(),       // data: string message in the command form "/cmd ..." used internally
    popup: $newMsgId(),        // Shows popops. See Game.Gui.Info to see what parameters are accepted.
    playStart: $newMsgId(),    // data: game percept, notify that the games has been loaded and ready to start
    gameEnded: $newMsgId(),    // everyone can listen for this message to know when the game ends
    playStop: $newMsgId(),     // everyone can listen for this message to know when the game state needs to be reset
    listStart: $newMsgId(),    // data: list percept, notify that the list has been loaded and ready to display
    listStop: $newMsgId(),     // everyone can listen for this message to know when the list must reset itself
    hiscoresStart: $newMsgId(),    // data: scores percept
    hiscoresStop: $newMsgId(),     // everyone can listen for this message to know when the hiscores must stop
    accountStart: $newMsgId(),    // data: account percept
    accountStop: $newMsgId(),     // everyone can listen for this message to know when the account must stop
    newState: $newMsgId(),      // everyone can listen for this message to know when the GAME enters a new state. data: 'state name'
    tabAlert: $newMsgId()      // data: {text: '...' [, priority: N >=0]} show an alert on browser tab if the tab is not focused.
  },

  /*******************************************************************
  /* Messages used to update game/player state */
  update: {
    infrastructures: $newMsgId(), // receives infrastructures => {v: [settlements], e: [roads]}
    player: $newMsgId(),          // receives player data
    game: $newMsgId(),            // receives infrastructures, longest road owner and biggest army (see play comm strategy)
    summary: $newMsgId(),         // data: game with summary hash (end game info)
    trade: $newMsgId(),           // data:
    offer: $newMsgId(),           // data:
    endTrade: $newMsgId(),        // data: trade with all offers
    endOffer: $newMsgId(),        // data: single offer hash
    joinGame: $newMsgId(),        // data: game percept with users []
    unjoinGame: $newMsgId(),      // data: game percept
    removeGame: $newMsgId(),      // data: game percept
    avatar: $newMsgId(),          // data: avatar name
    ready: $newMsgId(),           // data:
    hiscores: $newMsgId(),        // data: scores percept
    account: $newMsgId()          // data: account percept
  },

  /*******************************************************************/
  /* Internal events messages */
  event: {
     buildLinkStart: $newMsgId(),    // event invoked by the builder gui item when a buil link action starts => params empty
     buildLinkStop: $newMsgId(),     // event invoked by the builder gui item when a buil link action ends => params empty
     buildBaseStart: $newMsgId(),    // event invoked by the builder gui item when a buil outpost action starts => params empty
     buildBaseStop: $newMsgId(),     // event invoked by the builder gui item when a buil outpost action ends => params empty
     upgradeBaseStart: $newMsgId(),  // event invoked by the builder gui item when a buil station action starts => params empty
     upgradeBaseStop: $newMsgId(),   // event invoked by the builder gui item when a buil station action ends => params empty
     newMarketOffer: $newMsgId()     // event fired by the market when e new offer is received
  },

  /*******************************************************************/
  /* Sound messages */
  audio:{
    fx: $newMsgId(),          // data: {audio: 'audio_path', volume: [0..100]}
    music: $newMsgId(),       // data: {audio: 'audio_path', volume: [0..100]}
    mixer: $newMsgId(),       // data: {fxVolume: [0..100], musicVolume: [0..100]}
    mute: $newMsgId()         // data: true or false
  },

  /*******************************************************************/
  /* Remote procedure calls messages */
  rpc: {
    doFixedTrade: $newMsgId(),        // data: {r: receive, g: give} where receive and give are strings
    openTrade: $newMsgId(),           // open a new exchange with other players. Data is the requested resources hash: {ore: 3, ..}
    closeTrade: $newMsgId(),          // close the current exchange. Data: none
    counterOffer: $newMsgId(),        // Accepts a trade offer, data: offer id
    acceptOffer: $newMsgId(),         // Accepts a trade offer, data: offer id
    fundResearch: $newMsgId(),
    chaseAwayCriminality: $newMsgId(),
    build: $newMsgId(),               // build infrastructure, data: {cmd: commandName, target: targeCoords}
    chat: $newMsgId(),
    secretCmd: $newMsgId(),
    leaveGame: $newMsgId(),           // leave ended game command, no data
    giveupGame: $newMsgId(),          // giveup game command, no data
    joinGame: $newMsgId(),            // joins a game in list, data: {slot: slot, id: this.game.id}
    unjoinGame: $newMsgId(),          // unjoins a joined game in list, no data
    demoGame: $newMsgId(),            // demo game command, no data
    createGame: $newMsgId(),          // creata game command, no data
    selectAvatar: $newMsgId(),        // user selects an avatar. data: avatar name
    ready: $newMsgId(),               // toggles ready for the user. data: none
    hiscores: $newMsgId(),            // request the hof data to switch to the hof (client only) state
    account: $newMsgId(),             // request the account data to switch to the account (client only) state
    list: $newMsgId(),                // request the list data to switch to the list state
    saveSettings: $newMsgId()         // save settings on server. Data: settings json
  },

  /*******************************************************************/
  // AJAX messages

  /* AJAX success messages */
  success: {
    doFixedTrade: $newMsgId(),        // AJAX success for the rpc doFixedTrade
    counterOffer: $newMsgId(),        // AJAX success for the rpc doFixedTrade
    acceptOffer: $newMsgId(),         // AJAX success for the rpc doFixedTrade
    fundResearch: $newMsgId(),
    boycot: $newMsgId()
  },

  /* AJAX error messages */
  error: {
    doFixedTrade: $newMsgId(),        // AJAX error for the rpc doFixedTrade
    openTrade: $newMsgId(),           // AJAX error for the rpc openTrade
    closeTrade: $newMsgId(),          // AJAX error for the rpc closeTrade
    counterOffer: $newMsgId(),        // AJAX error for the rpc acceptOffer
    acceptOffer: $newMsgId(),         // AJAX error for the rpc acceptOffer
    fundResearch: $newMsgId(),
    boycot: $newMsgId()
  },

  /*******************************************************************/
  // User presence messages
  presence: {
    list: $newMsgId(),      // data: Members array with auth infos
    added: $newMsgId(),     // data: Member auth infos
    removed: $newMsgId(),   // data: Member auth infos
    update: $newMsgId()     // data: Member auth infos with updated state
  },

  /*******************************************************************/
  // User presence chats
  chat: {
    create: $newMsgId()        // data: userId, creates a new presence chat between me and another user
  }
}

var $msg = Game.Messages;
