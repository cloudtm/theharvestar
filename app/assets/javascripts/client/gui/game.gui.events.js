/********************************************************************************/
/*
 *  This Gui Item provides all global events needed by all other gui items in the game.
 *  
 **/
Game.Gui.Events = new Class({
  Extends: Game.Gui.Item,

  options: {
    template: 'none'
  },

  init: function(options){
    WORLD.element.click(function(event){ 
      this.send($msg.event.worldClick, {})
    }.bind(this));
    $log("Game.Gui.Events: added.");
  }
});

