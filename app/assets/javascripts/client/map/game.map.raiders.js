/****************************************************************/
/*                       RAIDER BASE                            */
/****************************************************************/

Game.Map.RaidersBase = new Class({
  Extends: Game.Map.Terrain,
  Implements: Core.Dispatchable,
  name: "RaidersBase",
  
  options: {
    landingOffset: {x: -1, y: 10}
  },
  
  initialize: function(options){
    this.parent(options);
    
    this.trade = {
      factor: Math.abs(CONFIG.gameOptions.bank_rate),  // Resource needed in exchange by the raiders
      resources: CONFIG.resourceSet().getKeys(),
      dialog: null,
      /* The button will be placed at the bottom of the map, just before the raiders.
      * Thus we need to transform it's coordinates from terrain to map
      * coordinates. It's simple as the terrain already has map coordinates, so
      * we need only to translates the center of the button to these ones. */
      button: $("<div class='trade-me'>"),
      pos: {left: this.x - 46, top: this.y - 64},
      enabled: false,
      forwarder: null,
      forwarding: false
    };
    // Sets button coordinates and places it o the MAP.
    this.trade.button.css(this.trade.pos);
    this.trade.forwarder = new Core.MouseEventsForwarder(this.trade.button, {enabled: false});
    MAP.element.append(this.trade.button);
    this.attachBehavior(this.trade.button);

    // Raiders are placed last so they have visibility priority over all other elements.
    this.raiders = new Game.Map.Raiders(this);
    MAP.appendChild(this.raiders);

    this.mapListeners([
      {map: $msg.info.resources, to: this.updateStatus},
      // Manages event forwarding of the trade button
      {map: $msg.event.buildLinkStart, to: this.forwardOn},
      {map: $msg.event.buildLinkStop, to: this.forwardOff},
      // Bases
      {map: $msg.event.buildBaseStart, to: this.forwardOn},
      {map: $msg.event.upgradeBaseStart, to: this.forwardOn},
      {map: $msg.event.buildBaseStop, to: this.forwardOff},
      {map: $msg.event.upgradeBaseStop, to: this.forwardOff},

      {map: $msg.info.gameEnded, to: this.ended},
    ]);

    this.updateStatus();
  },

  ended: function(){
    if(this.trade.dialog){
      this.trade.dialog.close();
      this.trade.dialog = null;
    }
  },
  
  raid: function(terrain){
    // If the terrain is already raided => do nothing
    if(this.areSame(this.raiders.onTerrain, terrain)) return;
    
    if(terrain.is(this)){
      this.tile.animation.next = "idle";
      this.raiders.retreat();
    } else {
      this.raiders.raid(terrain);
      if(this.tile.animation.name == "idle") this.tile.play("active");
    }
  },
  
  /****************************************************************/
  // Trade button events forwarding
  forwardOn: function(){
    this.trade.forwarder.enable();
    return true;
  },

  forwardOff: function(){
    this.trade.forwarder.enable(false);
    this.trade.button.css('cursor', 'pointer');
    return true;
  },

  /****************************************************************/
  // Trade button visibility

  updateStatus: function(){
    this.canTrade() ? this.showTrade() : this.hideTrade();
    return true;
  },
  
  canTrade: function(){
    return this.trade.resources.some(function(res){
      return (GAME.resources[res] >= this.trade.factor);
    }, this);
  },
  
  showTrade: function(){
    if(this.trade.enabled) return;
    this.trade.button.show()
      .animate({ opacity: 1 },{queue: false, duration: 250})
      .animate({ top: "+=40px" }, {easing: 'easeOutBounce', duration: 500});
    this.trade.enabled = true;
  },
  
  hideTrade: function(){
    if(!this.trade.enabled) return;
    this.trade.button.hide();
    this.trade.button.css({opacity: 0, top: this.trade.pos.top});
    this.trade.enabled = false;
  },
  
  /****************************************************************/
  // Trade button functionalilty
  
  attachBehavior: function(button){
    button.on('mousedown.raidersTrade', this.tradeIntent.bind(this));
    button.on('click.raidersTrade', this.offerTrade.bind(this));
  },

  tradeIntent: function(){
    if(this.trade.forwarder.isEnabled()){
      this.trade.forwarding = true; // will be reset only by the offerTrade
    } else {
      $send($msg.audio.fx, $fx.gui.buttonClick);
    }
  },

  offerTrade: function(){
    if(this.trade.forwarding){
      this.trade.forwarding = false;
      return;
    }
    if(this.trade.dialog) return; // Already on
    this.trade.dialog = new Game.Gui.RaidersDialog({center: MAP.element});
    this.observe(this.trade.dialog);
    GUI.appendChild(this.trade.dialog);
  },
  
  // Notifies dialog destruction
  notify: function(obj, event){
    if(event == Core.Events.destroyed) this.trade.dialog = null;
  },

  destroy: function(){
    this.raiders.destroy();
    this.trade.button.empty().remove();
    if(this.trade.dialog){
      this.trade.dialog.close();
    }
    this.parent();
  }
  
});

/****************************************************************/
/*                         RAIDERS                              */
/****************************************************************/
Game.Map.Raiders = new Class({
  Extends: Core.SpriteActor,
  name: "Raiders",
  
  options: {
    moveDuration: 2000,   // sync with $animation.raiders.move
    // We fix here sprite dimensions to avoid a recalculation at each frameResized event:
    width: 29,            // sprite width
    height: 78            // see the maximum frame height in the raiders animation.
  },
  
  initialize: function(base){
    this.parent();
    
    this.assign("<div class='raiders'>");
    new Core.MouseEventsForwarder(this.element);
    this.setAnimation($animation.terrain.raiders);

    this.offset = {x: -(this.options.width >> 1 ), y: -(this.options.height >> 1)};
    this.base = base;
    this.onTerrain = base;

    /* We first associated this sprite animations with setAnimation,
     * otherwise we have no access to frame dimensions and offset used in getOffset. */
    var screen = MAP.hex2screen(this.onTerrain, this.getOffset(base));
    this.positionTo(screen.x, screen.y);
  },

  raid: function(terrain){
    // Calculates starting position
    if(this.destination){
      this.startPos = {x: this.x, y: this.y}; // if already moving starts from current position
    } else {
      this.startPos = MAP.hex2screen(this.onTerrain, this.getOffset(this.onTerrain));
    }
    // Caluclate direction
    var endPos = MAP.hex2screen(terrain, this.getOffset(terrain));
    this.deltaX = (endPos.x - this.startPos.x);
    this.deltaY = (endPos.y - this.startPos.y);
    // Use an easing function to smooth the movement
    this.tr = new Core.Transitions;
    this.tr.add('movement', {ease: 'OutSine', duration: this.options.moveDuration});
    // Setup animation variables
    this.destination = terrain;
    this.time = 0;
    // Audio effect for raider movement
    $send($msg.audio.fx, $fx.map.raidersMove);
    // Playes the move sprite sequence (single frame for 2 sec and then -> 'animate' sequence)
    this.play("move");
    // Starts DynamicActor animation
    this.animate();
  },
  
  retreat: function(){
    this.raid(this.base);
    this.animation.next = "idle";
  },

  tick: function(delta){
    this.time += delta;
    // Calculates smoothed movement percentage, from 0 to 1.
    var scale = this.tr.swing(this.time).movement;
    var toX = this.startPos.x + (this.deltaX * scale);
    var toY = this.startPos.y + (this.deltaY * scale);
    this.moveTo(toX, toY);
    if(this.time >= this.options.moveDuration){
      this.onTerrain = this.destination;
      this.destination = null;
      return false;
    }
    return true;
  },

  /* Overrides the default behavior of frameResized because we do not want
   * auto centering behavior. We control frame centering in getOffset function. */
  frameResized: function(){},

  getOffset: function(terrain){
    var ani = this.animation;
    var offset = {
      dX: this.offset.x + ani.offsetX,
      dY: this.offset.y + ani.offsetY
    }
    if(terrain.is(this.base)){
      offset.dX += this.base.options.landingOffset.x;
      offset.dY += this.base.options.landingOffset.y;
    }
    return offset;
  }

});
