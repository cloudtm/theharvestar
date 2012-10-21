/***************************************************************************
 Game Ajax RPC calls
 ***************************************************************************/

Game.Rpc = new Class.Singleton({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  initialize: function(){
    this.mapListeners([
      {map: $msg.rpc.fundResearch, to: this.fundResearch},
      {map: $msg.rpc.chaseAwayCriminality, to: this.chaseAwayCriminality},
      {map: $msg.rpc.build, to: this.buildInfrastructure},
      {map: $msg.rpc.chat, to: this.sendChatMessage},
      {map: $msg.rpc.secretCmd, to: this.adminCmd},

      // Trade actions
      {map: $msg.rpc.doFixedTrade, to: this.doFixedTrade},
      {map: $msg.rpc.openTrade, to: this.openTrade},
      {map: $msg.rpc.closeTrade, to: this.closeTrade},
      {map: $msg.rpc.acceptOffer, to: this.acceptOffer},
      {map: $msg.rpc.counterOffer, to: this.counterOffer},

      // 2 game creation actions
      {map: $msg.rpc.createGame, to: this.createGame},
      {map: $msg.rpc.demoGame, to: this.demoGame},

      // join request
      {map: $msg.rpc.joinGame, to: this.joinGame},

      // 3 leave game actions (from list, game, summary)
      {map: $msg.rpc.unjoinGame, to: this.unjoinGame},
      {map: $msg.rpc.giveupGame, to: this.giveupGame},
      {map: $msg.rpc.leaveGame, to: this.leaveGame},

      // hof and account
      {map: $msg.rpc.hiscores, to: this.hiscores},
      {map: $msg.rpc.account, to: this.account},
      {map: $msg.rpc.list, to: this.list},

      // Others
      {map: $msg.rpc.selectAvatar, to: this.selectAvatar},
      {map: $msg.rpc.ready, to: this.ready},
      {map: $msg.rpc.saveSettings, to: this.saveSettings}
    ]);
  },

  buildInfrastructure: function(params){
    this.sendCommands(
      [{
        agent: {
          cmd: params.cmd,
          target: params.target
        }
      }],
      {type: 'rpc', name: 'build', params: params}
    );
  },

  doFixedTrade: function(trade){
    this.sendCommands(
      [{
        agent: {
          cmd: 'trade_bank',
          receive: trade.r,
          give: trade.g
        }
      }],
      this.notify($msg.success.doFixedTrade),
      this.notify($msg.error.doFixedTrade),
      {type: 'rpc', name: 'doFixedTrade', params: trade}
    );
  },

  openTrade: function(offer){
    this.sendCommands(
      [{
        agent: {
          cmd: 'place_trade_request',
          receive: offer.r,
          give: offer.g
        }
      }],
      null,
      this.notify($msg.error.openTrade),
      {type: 'rpc', name: 'openTrade', params: offer}
    );
  },

  closeTrade: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'close_trade_request'
        }
      }],
      null,
      this.notify($msg.error.closeTrade),
      {type: 'rpc', name: 'closeTrade'}
    );
  },

  acceptOffer: function(offerId){
    this.sendCommands(
      [{
        agent: {
          cmd: 'accept_offer',
          offer: offerId
        }
      }],
      this.notify($msg.success.acceptOffer, {id: offerId}),
      this.notify($msg.error.acceptOffer, {id: offerId}),
      {type: 'rpc', name: 'acceptOffer', params: offerId}
    );
  },

  counterOffer: function(offer){
    this.sendCommands(
      [{
        agent: {
          cmd: 'counter_offer',
          offer: offer.id,
          receive: offer.receive,
          give: offer.give,
          message: offer.message
        }
      }],
      this.notify($msg.success.counterOffer, {id: offer.id}),
      this.notify($msg.error.counterOffer, {id: offer.id}),
      {type: 'rpc', name: 'counterOffer', params: offer}
    );
  },

  sendChatMessage: function(message){
    this.sendCommands(
      [{
        agent: {
          cmd: 'playing_chat',
          message: message
        }
      }],
      {type: 'rpc', name: 'chat', params: message}
    );
  },

  fundResearch: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'buy_progress'
        }
      }],
      this.notify($msg.success.fundResearch),
      this.notify($msg.error.fundResearch),
      {type: 'rpc', name: 'fundResearch'}
    );
  },

  chaseAwayCriminality: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'use_social_progress'
        }
      }],
      this.notify($msg.success.boycot),
      this.notify($msg.error.boycot),
      {type: 'rpc', name: 'chaseAwayCriminality'}
    );
  },

  /* -command: {code: 'fill', ... other params ...} */
  adminCmd: function(command){
    if(!(command && command.code)) return;

    this.sendCommands(
      [{
        agent: {
          cmd: 'secret',
          command: command.code,
          args: command.args
        }
      }],
      {type: 'rpc', name: 'secretCmd', params: command}
    );
  },

  giveupGame: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'giveup'
        }
      }],
      {type: 'rpc', name: 'giveupGame'}
    );
  },

  createGame: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'create_game',
          format: 'base',
          name: 'game_' + CONFIG.userId
        }
      }],
      {type: 'rpc', name: 'createGame'}
    );
  },

  leaveGame: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'leave_game'
        }
      }],
      {type: 'rpc', name: 'leaveGame'});
  },

  joinGame: function(game){
    this.sendCommands(
      [{
        agent: {
          cmd: 'join_game',
          game_id: game.id,
          slot: game.slot
        }
      }],
      {type: 'rpc', name: 'joinGame', params: game}
    );
  },

  ready: function(){
    this.sendCommands([
      { agent: { cmd: 'ready' } },
      { agent: { cmd: 'play' } }
    ],
      {type: 'rpc', name: 'ready'}
    );
  },

  unjoinGame: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'unjoin_game'
        }
      }],
      {type: 'rpc', name: 'unjoinGame'}
    );
  },

  demoGame: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'demo',
          format: 'base',
          name: 'training_' + CONFIG.userId
        }
      }],
      {type: 'rpc', name: 'demoGame'}
    );
  },

  selectAvatar: function(avatar){
    this.sendCommands(
      [{
        agent: {
          cmd: 'select_avatar',
          avatar: avatar
        }
      }],
      {type: 'rpc', name: 'selectAvatar', params: avatar}
    );
  },

  hiscores: function(params){
    this.sendCommands(
      [{
        agent: {
          cmd: 'hiscores',
          mypos: params.mypos || false,
          size: params.size,
          page: params.page || 1,
          search: params.search
        }
      }],
      {type: 'rpc', name: 'hof', params: params}
    );
  },

  account: function(account){
    // FIXME: this command don't use execute action but account
    this.sendCommands(
      [{
        agent: {
          cmd: 'account',
          account: account
        }
      }],
      {type: 'rpc', name: 'account', params: account}
    );
  },

  list: function(){
    this.sendCommands(
      [{
        agent: {
          cmd: 'list'
        }
      }],
      {type: 'rpc', name: 'list'}
    );
  },

  saveSettings: function(settingsJson){
    this.sendCommands(
      [{
        agent: {
          cmd: 'save_settings',
          settings: settingsJson
        }
      }],
      {type: 'rpc', name: 'list', params: settingsJson}
    );
  },

  /*
   * Translate the array of actions into the commands hash in the form
   * accepted from the server.
   */
  toCommands: function(actions){
    var commands = {
      action: 'execute',
      data: { actions: JSON.stringify(actions) },
      dataType: 'json'
    };
    return commands;
  },

  /*
   * Send a list of commands to the server via AJAX.
   */
  sendCommands: function(actions, success, error) {
    var commands = this.toCommands(actions, history);
    if(success != null)
      commands.success = success;
    if(error != null)
      commands.error = error;
    this.toHistory(commands, history);
    AJAX.call(commands);
  },

  /* Use this method in ajax success and error callbacks to fire
   * success or error messages. Example:
   *
   * AJAX.call({
   *   action: 'execute',
   *   data: {
   *     'agent[cmd]': 'trade_bank',
   *     'agent[receive]': trade.r,
   *     'agent[give]': trade.g
   *   },
   *   success: this.notify($msg.success.doFixedTrade),
   *   error: this.notify($msg.error.doFixedTrade)
   * });
   *
   * You can also pass data like in a dispatcher send command but
   * the data MUST be a hash.
   **/
  notify: function(msg, data){
    data = ($type(data) == "object") ? data : {};
    var notifier = function(p1, status, p2){

      /* jQuery success and error parameters:
       * success(data, textStatus, jqXHR)
       * error(jqXHR, textStatus, errorThrown)
       * see http://api.jquery.com/jQuery.ajax/
       **/

      // Sends only the jqXHR object
      data.xhr = ($type(p2) == "string") ? p1 : p2;
      this.send(msg, data);
    }
    return notifier.bind(this);
  },

  toHistory: function(request, event){
    if(CONFIG.debugging.debug){ HISTORY.push(request, event); }
  }

});
