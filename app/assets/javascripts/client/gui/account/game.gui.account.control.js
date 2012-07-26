/***************************************************************************
             Hiscores Control Panel (sounds mixer, quitting...)
***************************************************************************/

Game.Gui.AccountControlPanel = new Class({
  Extends: Game.Gui.Item,
  name: "AccountControlPanel",

  options:{
    template: 'none'
  },
  
  init: function(options){

    // High Scores title
    this.element.append($("<div class='account'>ACCOUNT</div>"));
    // Algorithmica logo
//    this.element.append($("<div class='algorithmica'></div>"));
    // The harvestar logo
    this.element.append($("<div class='harvestar'></div>"));

    $log("Game.Gui.AccountControlPanel: added.");
  }
});
