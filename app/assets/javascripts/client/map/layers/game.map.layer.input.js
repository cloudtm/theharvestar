/********************************************************************************/
/* This layer manages the user input (hover and click). It's filled with link and
 * base input pads. They are by default inactive (display none) and are activated
 * independently by the build events. This class holds all of these pads and manages
 * their activation/deactivation. */
Game.Map.InputLayer = new Class({
  Extends: Core.StaticActor,
  Implements: Core.Dispatchable,
  name: "InputLayer",

  options: {
    cssClass: 'input-pads',
    links: 'linkpads',
    bases: 'basepads'
  },

  initialize: function(){
    this.parent();
    this.assign('<div>').addClass(this.options.cssClass);
    
    this.mapListeners([
      // Links
      {map: $msg.event.buildLinkStart, to: this.linksOn},
      {map: $msg.event.buildLinkStop, to: this.linksOff},
      // Bases
      {map: $msg.event.buildBaseStart, to: this.baseL1On},
      {map: $msg.event.buildBaseStop, to: this.baseOff},
      // Stations
      {map: $msg.event.upgradeBaseStart, to: this.baseL2On},
      {map: $msg.event.upgradeBaseStop, to: this.baseOff}
    ]);
    // the build level represents the infrastructure type that the user
    // has selected to build
    // buildLevel = 0 : the build is disabled
    // buildLevel >= 1 : the build is enabled and provides the upgrade level requested
    this.buildLevel = 0;
  },

  // Activate links to accept build events.
  linksOn: function(){
    this.element.addClass(this.options.links);
    this.buildLevel = 1;
    return true;
  },

  // Deactivate links to accept build events.
  linksOff: function(){
    this.element.removeClass(this.options.links);
    this.buildLevel = 0;
    return true;
  },
  
  // Activate the infrastructures to accept build colony events.
  baseL1On: function(){
    this.element.addClass(this.options.bases);
    this.buildLevel = 1;
    return true;
  },

  // Activate the infrastructures to accept build city events.
  baseL2On: function(){
    this.element.addClass(this.options.bases);
    this.buildLevel = 2;
    return true;
  },

  // Deactivate the infrastructures to accept build city events.
  baseOff: function(){
    this.element.removeClass(this.options.bases);
    this.buildLevel = 0;
    return true;
  }
  
});

/* Each of this pad controls a structure (link or base) and calls
 * their event methods on hover or click. Each pad is visually aligned
 * with the controller structure below. */
Game.Map.InputPad = new Class({
  Extends: Core.StaticActor,
  name: "InputPad",
  
  options: {
    cssClass: 'pad'
  },
  
  initialize: function(structure){
    this.parent();
    this.structure = structure;
    this.assign('<div>').addClass(this.options.cssClass);
    
    this.element.addClass(structure.type);
    if(structure.type == "link"){
      this.element.addClass(structure.orientation);
      this.positionTo(structure.x, structure.y);
    } else {
      this.positionTo(structure.x, structure.y + 15); // corrects the -15 offset for the base tile
    }
    
    this.element.hover(this.padHoverIn.bind(this), this.padHoverOut.bind(this));
    this.element.click(this.padClicked.bind(this));
  },
  
  padClicked: function(){
    this.structure.click(this.parentActor.buildLevel);
  },
  
  padHoverIn: function(){
    this.structure.hover(true, this.parentActor.buildLevel);
  },
  
  padHoverOut: function(){
    this.structure.hover(false);
  }
});
