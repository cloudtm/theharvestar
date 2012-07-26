/*********************************************************************
 *                          MAP STRUCTURES
 *********************************************************************/
// Superclass of all infrastructures (bases and links)
Game.Map.Infrastructure = new Class({
  Extends: Core.StaticActor,
  Implements: Core.Dispatchable,
  name: "Abstract Infrastructure",

  level: 0,   // Upgrade level
  hexX: 0,    // Hexagon coordinate X
  hexY: 0,    // Hexagon coordinate Y
  bfZ: 0, // Back to front visibility (higher order overlaps lower order)
  lrZ: 0, // Left to right visibility (higher order overlaps lower order)
  offset: {dX: 0, dY: 0}, // tile offset (for centering)
  type: 'abstract',
  upgrades: ['none'],   // Upgrade names
  player: 0, // Player is initialized by the building contructor and is always overwritten by the set() function
  terrains: null,   // Terrain hexagons array
  cmdPrefix: '',

  /* Sets the building upgrade level and owner (player)
   *
   * params: { level: upgradeLevel, player: player }
   *
   * Notes: due to the element.width() / .height(), this function can be used only when
   * the building belongs to the DOM. If used before appending the building to the DOM,
   * element.width() / .height() always return 0 and all building will be placed, overlapped,
   * in the upper left corner. That means that set cannot be used in the subclasses constructors. */
  set: function(params){
    /* Changes the element class (image) to reflect the upgrade */
    // Removes actual class
    this.element.removeClass(this.levelClass());
    this.player = params.player;
    this.level = params.level;
    // Adds the new class
    this.element.addClass(this.levelClass());
    
    var screen = MAP.hex2screen({
      hexX: this.hexX,
      hexY: this.hexY
    }, this.offset);
    this.moveTo(screen.x, screen.y);  // Position + redraw
  },

  /* Returns the css class for the current building level. This class defines the building appearance.
   * Examples: link l0, link l1_2 */
  levelClass: function(){
    var lclass = this.type  + ' l' + this.level;
    if(this.level != 0) lclass += ('_' + this.player);
    return lclass;
  },

  // VALIDATION FUNCTIONS
  /****************************************************************************************
   * Tell if this infrastructure is owned by the current player.
   * In this case is considered owned by the player also empty infrastructures
   * (level = 0). */
  isMine: function(){
    return( this.player == GAME.player || this.level == 0 );
  },

  // Returns true if the structure allows further upgrades
  isUpgradable: function(){
    return (this.upgrades.length > (this.level + 1)) && this.isMine();
  },

  /* Checks whether the conditions to build/upgrade this structure are satisfied:
   * it must be mine and it must allow upgrades. */
  isBuildEnabled: function(buildLevel){
    return ((buildLevel == (this.level + 1)) && this.isUpgradable());
  },
  
  // INPUT HANDLING FUNCTIONS
  /****************************************************************************************
   * Event called by the input pad controller when hovering over the pad.
   * - inside: [true | false] tells the hover direction (true => hover in, false => hover out)
   * - buildLevel: when hovering in (inside => true), buildLevel tells the whished structure
   *   level to build. It's used to discard hovering over structures that cannot be upgraded. */
  hover: function(inside, buildLevel){
    var hoverClass = "hover" + GAME.player;
    if(inside){
      if(this.isBuildEnabled(buildLevel)){
        this.element.addClass(hoverClass);
      }
    } else {
      this.element.removeClass(hoverClass);
    }
  },
  
  /* Event called by the input pad controller when clicking on the pad.
   * It's used to build/upgrade the structure if the conditions are satisfied.
   * buildLevel: tells the whished structure level. It's used to validate the build conditions. */
  click: function(buildLevel){
    this.element.removeClass("hover" + GAME.player);  // removes the hover class on click
    if(this.isBuildEnabled(buildLevel)) this.build();
  },

  // BUILD / UPGRADE FUNCTION
  /****************************************************************************************
   * Sends the build command */
  build: function(){
    this.send($msg.rpc.build, {
      cmd: this.cmdPrefix + this.upgrades[this.level +1],
      target : this.terrains
    });
  },
  
  toJSON: function(){
    var inspect = ", level: " + this.level;
    inspect += ", hexX: " + this.hexX;
    inspect += ", hexY: " + this.hexY;
    inspect += ", bfZ: " + this.bfZ;
    inspect += ", lrZ: " + this.lrZ;
    inspect += ", offset: " + JSON.stringify(this.offset).replace(/"/g, "'");
    inspect += ", type: " + this.type;
    inspect += ", upgrades: " + JSON.stringify(this.upgrades).replace(/"/g, "'");
    inspect += ", player: " + this.player;
    inspect += ", terrains: " + JSON.stringify(this.terrains).replace(/"/g, "'");
    inspect += ", cmdPrefix: " + this.cmdPrefix;
    return(this.parent() + inspect);
  }

});

/********************************************************************************/
// Map links
Game.Map.Link = new Class({
  Extends: Game.Map.Infrastructure,
  name: "Link",

  options: {
    type: 'link'
  },
  cmdPrefix: "build_",

  initialize: function(params){
    this.parent();

    // Initialize building parameters
    this.hexX = params.hexX;
    this.hexY = params.hexY;
    this.terrains = params.terrains;
    if(params.level) this.level = params.level;
    this.bfZ = params.bf;
    this.lrZ = params.lr;

    this.type = this.options.type;
    this.upgrades = CONFIG.linkUpgrades;
    this.player = GAME.player;

    // audio fx by level
    this.buildFx = [$fx.gui.link];

    // Calculates road rotation
    var deltaX = this.terrains[0] - this.terrains[2];
    var deltaY = this.terrains[1] - this.terrains[3];
    // V: vertical (Y axis), H:horizontal (X axis), R: rotated (XY axis)
    this.orientation = deltaX == 0 ? 'hor' : (deltaY == 0 ? 'ver' : 'rot');
    this.offset.dX = - CONFIG.linkSize[this.orientation].w >> 1;
    this.offset.dY = - CONFIG.linkSize[this.orientation].h >> 1;

    this.assign('<div>').addClass(this.levelClass()).addClass(this.orientation);
    var screen = MAP.hex2screen(params, this.offset);
    this.positionTo(screen.x, screen.y);
  }
});

/********************************************************************************/
// Map bases (outposts, stations)
Game.Map.Outpost = new Class({
  Extends: Game.Map.Infrastructure,
  name: "Outpost",

  options: {
    type: 'base'
  },
  cmdPrefix: "build_",

  initialize: function(params){
    this.parent();

    // Initialize building parameters
    this.hexX = params.hexX;
    this.hexY = params.hexY;
    this.terrains = params.terrains;
    if(params.level) this.level = params.level;
    this.bfZ = params.bf;
    this.lrZ = params.lr;

    this.type = this.options.type;
    this.upgrades = CONFIG.baseUpgrades;
    this.player = GAME.player;

    // audio fx by level
    this.buildFx = [$fx.gui.outpost, $fx.gui.station];

    this.assign('<div>').addClass(this.levelClass());
    this.offset.dX = -(CONFIG.baseSize.w >> 1);
    this.offset.dY = -(CONFIG.baseSize.h >> 1) -15;

    var screen = MAP.hex2screen(params, this.offset);
    this.positionTo(screen.x, screen.y);
  }
});
