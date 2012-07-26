/********************************************************************************/
// The Harvestare title
Game.Map.TitleLayer = new Class({
  Extends: Core.StaticActor,
  name: "TitleLayer",
  
  options: {
    cssClass: 'title'
  },

  initialize: function(){
    this.parent();
    this.assign('<div>').addClass(this.options.cssClass);
    this.positionTo(-419, -304);
  }
});
