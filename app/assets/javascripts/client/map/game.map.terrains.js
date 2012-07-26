/*********************************************************************
 *                              TERRAIN
 *********************************************************************/
/* Creates an hexagon terrain.
 *
 *  params: {hexX: int, hexY: int, type: cssClass, prob: probability}
 *
 * Coordinate system is hex grid (screen independent), cssClass is a css class defined in the stylesheet,
 * probability is the standard Catan probability, from 2 to 12, where 7 should never appear.
 * The hexagon should not be created manually but my the Map#build method. That assures that the hexagon
 * belongs to the Map and allows to search for it with Map#getHexagon method. */
Game.Map.Terrain = new Class({
  Extends: Core.StaticActor,
  name: "Terrain",
  
  options: {
    cssClass: 'terrain'
  },

  initialize: function(options){
    this.parent();
    
    this.hexX = options.hexX;  // hexagon coordinate X
    this.hexY = options.hexY;  // hexagon coordinate Y
    this.type = options.type;  // terrain type name
    this.bfZ = options.bf;     // back to front visibility
    this.lrZ = options.lr;     // left to right visibility

//    this.outposts = [];   // all outpost that uses this terrain
//    this.links = [];      // all links that uses this terrain

    // Creates the terrain element
    this.assign('<div>').addClass(this.options.cssClass).addClass(this.type);

    /* Every terrain has a probability of producing a resource in the range 2..6, 8..12 where
     * 2 and 12 are the worst probabilty, 6 and 8 are the higher (gaussian bell, where 7, the most
     * probable, is reserved for raided event).
     * The probability is converted into productivity in the range 0..4 where 0 is the worst probability. */
    this.productivity = options.prob ? options.prob - 2 : 5; // when params.prob == 0 (like desert), productivity => 5
    if(this.productivity > 5) this.productivity = 10 - this.productivity;
    
    this.element.addClass("p" + this.productivity);
    
    this.tile = new Game.Map.Terrain.Tile({
      type: this.type,
      productivity: this.productivity
    })
    this.appendChild(this.tile);
    
    var screen = MAP.hex2screen(options);
    this.positionTo(screen.x, screen.y);

    //DEBUG
    //this.tile.element.append($("<div style='position: absolute; top: 90px; left: 44px; z-index: 1;'>" + options.prob + "</div>"))
  },

  // Adds a resource self-destroying production animated actor
  produce: function(quantity){
    this.appendChild(new Game.Map.Production({
      type: this.type,
      raided: this.is(MAP.raidersBase.raiders.onTerrain)
    }));
  },

  // Returns true if this terrain (array or Terrain) equals the passed terrain
  is: function(terrain){
    if($type(terrain) == "array"){
      return (this.hexX == terrain[0] && this.hexY == terrain[1]);
    }
    return (this.hexX == terrain.hexX && this.hexY == terrain.hexY);
  },
  
  // returns true if the 2 terrains (array or Terrain) represent the same terrain
  areSame: function(terrainA, terrainB){
    if($type(terrainA) == "array"){
      var aX = terrainA[0], aY = terrainA[1];
    } else {
      aX = terrainA.hexX, aY = terrainA.hexY;
    }
    if($type(terrainB) == "array"){
      var bX = terrainB[0], bY = terrainB[1];
    } else {
      bX = terrainB.hexX, bY = terrainB.hexY;
    }
    return(aX == bX && aY == bY);
  }
});


// Animated terrain tile, included into terrain
Game.Map.Terrain.Tile = new Class({
  Extends: Core.SpriteActor,
  name: "Terrain Tile",

  options: {
    cssClass: 'tile'
  },

  initialize: function(options){
    this.parent();
    
    this.assign('<div>').addClass(this.options.cssClass);
    
    var animation = $animation.terrain[options.type + options.productivity];
    this.setAnimation(animation);
  }
});

/*********************************************************************
 *                            PRODUCTION
 *********************************************************************/
Game.Map.Production = new Class({
  Extends: Core.SpriteActor,
  name: "Production",

  options: {
    cssClass: 'production',
    duration: 3000, // movement duration
    movement: 50,   // up movement
    frameMap: {
      cyclon: 0,
      mountain: 1,
      lake: 2,
      field: 3,
      volcano: 4
    }
  },

  /* options:
   * - type: terrain type
   * - raided: [true|false] is this terrain raided? */
  initialize: function(options){
    this.parent();

    this.type = options.type;
    this.assign("<div>").addClass(this.options.cssClass);

    if(options.raided){
      //$send($msg.info.popup, {key: 'action.tips.raided_resource', type: 'alert'})
      this.setAnimation($animation.terrain.production.explode);
    } else {
      $send($msg.audio.fx, $fx.map[this.type]);
      this.setAnimation($animation.terrain.production.normal);
    }
    
    this.startPos = {
      x: -this.animation.frameW >> 1,
      y: -(this.animation.frameH >> 1)
    };
    
    this.dY = this.options.movement / this.options.duration;
    this.dAlpha = 3 / this.options.duration;
    this.time = 0;
  },

  afterAppend: function(){
    this.animate();
  },
  
  animationLoaded: function(name){
    // Sets the proper first static frame for the animation
    if(name == "idle")
      this.animation.frames[0] = this.options.frameMap[this.type];
  },

  tick: function(delta){
    this.time += delta;
    this.moveTo(this.startPos.x, this.startPos.y - (this.dY * this.time));
    this.element.css({
      'opacity': 3 - this.dAlpha * this.time
    })
    if(this.time >= this.options.duration){
      this.destroy();
      return false;
    }
    return true;
  }
});