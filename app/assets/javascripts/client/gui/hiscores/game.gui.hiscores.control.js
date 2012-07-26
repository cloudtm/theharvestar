/***************************************************************************
             Hiscores Control Panel (sounds mixer, quitting...)
***************************************************************************/

Game.Gui.HiscoresControlPanel = new Class({
  Extends: Game.Gui.Item,
  name: "HiscoresControlPanel",

  options:{
    template: 'none'
  },
  
  init: function(options){

    // High Scores title
    this.element.append($("<div class='highscores'><div>HIGH</div><div>SCORES</div></div>"));
    // Algorithmica logo
//    this.element.append($("<div class='algorithmica'></div>"));
    // The harvestar logo
    this.element.append($("<div class='harvestar'></div>"));

    $log("Game.Gui.HiscoresControlPanel: added.");
  }

});
