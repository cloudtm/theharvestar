/********************************************************************************/
// Contains both terrains ans bases ordered back to front (order inspectable in children array)
Game.Map.IsometryLayer = new Class({
  Extends: Core.StaticActor,
  name: "IsometryLayer",

  options: {
    cssClass: 'isometry'
  },

  initialize: function(){
    this.parent();
    this.assign('<div>').addClass(this.options.cssClass);
    
    this.terrains = new Hash;
    this.outposts = new Hash;
  },

  // Retrieves a terrain given it's coordinates ([hX, hY])
  getTerrain: function(coords){
    return this.terrains.get(coords[0] + ',' + coords[1]);
  },
  
  // Retrieves an outpost given it's vertex (3 hexagon coordinates [h1X, h1Y, h2X, h2Y, h3X, h3Y])
  getOutpost: function(vertex){
    var vX = vertex[0] + vertex[2] + vertex[4]; // unique vertex X coordinate
    var vY = vertex[1] + vertex[3] + vertex[5]; // unique vertex Y coordinate
    return this.outposts.get(vX + ',' + vY);
  }
});
