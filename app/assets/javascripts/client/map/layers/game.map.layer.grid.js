/********************************************************************************/
Game.Map.GridLayer = new Class({
  Extends: Core.StaticActor,
  Implements: Core.Dispatchable,
  name: "GridLayer",
  
  options: {
    cssClass: 'actiongrid'
  },
  
  initialize: function(){
    this.parent();
    this.anchor.custom = this.options.cssClass;
    this.assign('<div>');
    
    this.mapListeners([
      // Links
      {map: $msg.event.buildLinkStart, to: this.showGrid},
      {map: $msg.event.buildLinkStop, to: this.hideGrid},
      // Bases
      {map: $msg.event.buildBaseStart, to: this.showGrid},
      {map: $msg.event.buildBaseStop, to: this.hideGrid},
      // Stations
      {map: $msg.event.upgradeBaseStart, to: this.showGrid},
      {map: $msg.event.upgradeBaseStop, to: this.hideGrid}
    ]);
    this.element.hide();
  },
  
  showGrid: function(){
    this.element.stop(false, true).fadeIn(200);
    return true;
  },
  
  hideGrid: function(){
    this.element.stop(false, true).fadeOut(200);
    return true;
  }
});
