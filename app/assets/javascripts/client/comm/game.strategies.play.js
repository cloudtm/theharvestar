/***************************************************************************
                       Game Play Server Message Strategies
***************************************************************************/
// Updates the game state (map state and anything that is public)
Game.Strategy.UpdateGame = new Class({
  Extends: Game.Strategy,
  name: "UpdateGame",

  crunch: function(game){
    if(Game.Versioning.isNewGame(game)){
      this.send($msg.update.game, game);
    }
  }
});

/********************************************************************************/
// Updates the private player state
Game.Strategy.UpdatePlayer = new Class({
  Extends: Game.Strategy,
  name: "UpdatePlayer",

  crunch: function(player){
    if(Game.Versioning.isNewPlayer(player)){
      this.send($msg.update.player, player);
    }
  }
});

/********************************************************************************/
// Updates productions
Game.Strategy.UpdateProduction = new Class({
  Extends: Game.Strategy,
  name: "UpdateProduction",

  crunch: function(productions){
    this.send($msg.info.production, productions.producing)
    this.send($msg.info.raid, productions.wasting)
  }
});

/********************************************************************************/
// Message received upon the creation of a new exchange
Game.Strategy.UpdateTrade = new Class({
  Extends: Game.Strategy,
  name: "UpdateTrade",

  crunch: function(trade){
    this.send($msg.update.trade, trade);
  }
});

/********************************************************************************/
// Updates an offer (it can be a new published offer or an owned offer)
Game.Strategy.UpdateOffer = new Class({
  Extends: Game.Strategy,
  name: "UpdateOffer",

  crunch: function(offer){
    this.send($msg.update.offer, offer);
  }
});

/********************************************************************************/
// Removes my exchange request and all its offers
Game.Strategy.EndTrade = new Class({
  Extends: Game.Strategy,
  name: "EndTrade",

  crunch: function(endedTrade){
    this.send($msg.update.endTrade, endedTrade.offers);
  }
});

/********************************************************************************/
// Removes an offer: this message is received only for published offers, not for
// my trade offers (I receive an end_trade for that).
Game.Strategy.EndOffer = new Class({
  Extends: Game.Strategy,
  name: "EndOffer",

  crunch: function(endedOffer){
    this.send($msg.update.endOffer, endedOffer);
  }

});

/********************************************************************************/
// Updates messages
Game.Strategy.UpdateChat = new Class({
  Extends: Game.Strategy,
  name: "UpdateChat",

  crunch: function(message){
    this.send($msg.info.chat, message);
  }

});

/********************************************************************************/
// Notifies infos from server
Game.Strategy.InfoMechanics = new Class({
  Extends: Game.Strategy,
  name: "InfoMechanics",

  crunch: function(message){
    this.send($msg.info.popup, message);
  }

});


/********************************************************************************/
// Notifies infos from server
Game.Strategy.CloseUi = new Class({
  Extends: Game.Strategy,
  name: "CloseUi",

  crunch: function(uuid){
    if(uuid != CONFIG.uuid){
      alert('Other ui opened!');
    }
  }

});
/********************************************************************************/
// Avatar update
Game.Strategy.SelectAvatar = new Class({
  Extends: Game.Strategy,
  name: "SelectAvatar",

  crunch: function(game){
    this.send($msg.update.avatar, game);
  }

});

/********************************************************************************/
// User leaved from summary
Game.Strategy.SummaryLeaved = new Class({
  Extends: Game.Strategy,
  name: "SummaryLeaved",

  crunch: function(pid){
    this.send($msg.info.summaryLeaved, pid);
  }

});

/********************************************************************************/
// State Change
Game.Strategy.ManageState = new Class({
  Extends: Game.Strategy,
  name: "ManageState",

  crunch: function(percept){
    GAME.event(percept.user_state, percept);
  }

});
