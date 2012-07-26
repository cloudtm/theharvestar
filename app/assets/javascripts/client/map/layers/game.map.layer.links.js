/********************************************************************************/
// Contains all the links ordered back to front (children contains the link array)
Game.Map.LinkLayer = new Class({
  Extends: Core.StaticActor,
  name: "LinkLayer",
  
  options: {
    cssClass: 'links'
  },

  initialize: function(){
    this.parent();
    this.assign('<div>').addClass(this.options.cssClass);
    this.links = new Hash;
  },
  
  // Retrieves a road given it's edge (2 hexagon coordinates [h1X, h1Y, h2X, h2Y])
  getLink: function(edge){
    var eX = edge[0] + edge[2]; // unique edge X coordinate
    var eY = edge[1] + edge[3]; // unique edge Y coordinate
    return this.links.get(eX + ',' + eY);
  }
});
