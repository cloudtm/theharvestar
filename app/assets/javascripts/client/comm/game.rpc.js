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
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': params.cmd,
        'agent[target]': params.target
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'build', params: params});
    AJAX.call(request);
  },

  doFixedTrade: function(trade){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'trade_bank',
        'agent[receive]': trade.r,
        'agent[give]': trade.g
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'doFixedTrade', params: trade});
    request.success = this.notify($msg.success.doFixedTrade);
    request.error = this.notify($msg.error.doFixedTrade);
    AJAX.call(request);
  },

  openTrade: function(offer){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'place_trade_request',
        'agent[receive]': offer.r,
        'agent[give]': offer.g
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'openTrade', params: offer});
    request.error = this.notify($msg.error.openTrade);
    AJAX.call(request);
  },

  closeTrade: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'close_trade_request'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'closeTrade'});
    request.error = this.notify($msg.error.closeTrade);
    AJAX.call(request);
  },

  acceptOffer: function(offerId){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'accept_offer',
        'agent[offer]': offerId
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'acceptOffer', params: offerId});
    request.success = this.notify($msg.success.acceptOffer, {id: offerId});
    request.error = this.notify($msg.error.acceptOffer, {id: offerId});
    AJAX.call(request);
  },

  counterOffer: function(offer){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'counter_offer',
        'agent[offer]': offer.id,
        'agent[receive]': offer.receive,
        'agent[give]': offer.give,
        'agent[message]': offer.message
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'counterOffer', params: offer});
    request.success = this.notify($msg.success.counterOffer, {id: offer.id});
    request.error = this.notify($msg.error.counterOffer, {id: offer.id});
    AJAX.call(request);
  },

  sendChatMessage: function(message){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'playing_chat',
        'agent[message]': message
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'chat', params: message});
    AJAX.call(request);
  },

  fundResearch: function(){
    var request = {
      action: 'execute',
      data:{
       'agent[cmd]': 'buy_progress'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'fundResearch'});
    request.success = this.notify($msg.success.fundResearch);
    request.error = this.notify($msg.error.fundResearch);
    AJAX.call(request);
  },

  chaseAwayCriminality: function(){
    var request = {
      action: 'execute',
      data:{
        'agent[cmd]': 'use_social_progress'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'chaseAwayCriminality'});
    request.success = this.notify($msg.success.boycot);
    request.error = this.notify($msg.error.boycot);
    AJAX.call(request);
  },

  /* -command: {code: 'fill', ... other params ...} */
  adminCmd: function(command){
    if(!(command && command.code)) return;

    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'secret',
        'agent[command]': command.code,
        'agent[args]': command.args
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'secretCmd', params: command});
    AJAX.call(request);
  },

  giveupGame: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'giveup'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'giveupGame'});
    AJAX.call(request);
  },

  createGame: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'create_game',
        'agent[format]': 'base',
        'agent[name]': 'game_' + CONFIG.userId
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'createGame'});
    AJAX.call(request);
  },

  leaveGame: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'leave_game'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'leaveGame'});
    AJAX.call(request);
  },

  joinGame: function(game){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'join_game',
        'agent[game_id]': game.id,
        'agent[slot]': game.slot
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'joinGame', params: game});
    AJAX.call(request);
  },

  ready: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'ready'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'ready'});
    AJAX.call(request);
  },

  unjoinGame: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'unjoin_game'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'unjoinGame'});
    AJAX.call(request);
  },

  demoGame: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'demo',
        'agent[format]': 'base',
        'agent[name]': 'training_' + CONFIG.userId
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'demoGame'});
    AJAX.call(request);
  },

  selectAvatar: function(avatar){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'select_avatar',
        'agent[avatar]': avatar
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'selectAvatar', params: avatar});
    AJAX.call(request);
  },

  hiscores: function(params){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'hiscores',
        'agent[mypos]': params.mypos || false,
        'agent[size]': params.size,
        'agent[page]': params.page || 1,
        'agent[search]': params.search
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'hof', params: params});
    AJAX.call(request);
  },

  account: function(account){
    var request = {
      action: 'account',
      data: {
        'agent[cmd]': 'account',
        'agent[account]': account
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'account', params: account});
    AJAX.call(request);
  },

  list: function(){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'list'
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'list'});
    AJAX.call(request);
  },

  saveSettings: function(settingsJson){
    var request = {
      action: 'execute',
      data: {
        'agent[cmd]': 'save_settings',
        'agent[settings]' : settingsJson
      }
    };
    this.toHistory(request, {type: 'rpc', name: 'list', params: settingsJson});
    AJAX.call(request);
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
