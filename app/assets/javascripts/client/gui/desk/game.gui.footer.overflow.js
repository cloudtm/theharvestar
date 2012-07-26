// The footer overflow is a 0 height line, bottom fixed, starting from center
Game.Gui.FooterOverflow = new Class({
  Extends: Game.Gui.Item,
  name: "FooterOverflow",

  options: {
    template: 'none'
  },

  init: function(options){
    this.appendChild(new Game.Gui.Presence({
      anchor: {custom: 'presence-panel-view'}
    }));

  }

});