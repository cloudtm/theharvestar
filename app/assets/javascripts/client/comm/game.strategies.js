/***************************************************************************
                       Game Server Message Responder
***************************************************************************/
Game.Responder = new Class.Singleton({
  Extends: Core.Base,

  initialize: function(){
    this.parent();
    this.strategyFactory = Game.Strategy.Factory.getInstance();
  },

  event: function(eventId, eventData){
    if(CONFIG.debugging.debug){
      percept = eventData;
      HISTORY.push(percept, {type: 'strategy', name: eventId});
    }
    if(!this.strategyFactory){
      $log("GameController: no strategy factory supplied!", {level: "error"});
      return;
    }
    $log("Received server message: \"" + eventId + "\"", {section: "open"});
    var strategy = this.strategyFactory.make(eventId);
    if(strategy){
      $log("Strategy found, trying to crunch");
      try{
        strategy.crunch(eventData);
        $log("Message crunched!");
      } catch(err){
        var msg = "There was an error executing: " + strategy.name + " Strategy\n"
        msg += err.stack + "\n";
        $log(msg, {level: "error"});
      }
    }
    $log({section: "close"});
  }
  
});

/* ............................................................ */
/* Abstract game strategy. All trategies must derive from this. */
Game.Strategy = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    name: 'Abstract Strategy'
  },

  initialize: function(){
    this.parent();
  },

  exists: function(selector){
    return ($(selector).length > 0);
  },

  crunch: function(data){
    throw "Cannot invoke " + this.options.name;
  }

});

/************************************************************************/
/* Game action strategy (dynamic) factory */
Game.Strategy.Factory = new Class.Singleton({
  Extends: Core.Base,

  /* Returns the strategy capable of handling the event identified by eventId. */
  make: function(eventId){
    var strategy = null;
    try {
      var strategyClass = eventId.camelCase().capitalize();
      strategy = new Game.Strategy[strategyClass];
    } catch(err){
      $log("No strategy for event: " + eventId, {level: "error"});
    }
    return strategy;
  }
});
