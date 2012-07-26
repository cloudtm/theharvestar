//==============================================
// GUI
//==============================================
Game.Gui = new Class.Singleton({
  Extends: Core.Actor,
  name: "Gui",

  /* Initialize and builds the gui based on the options.
  initialize: function(){
    this.parent();
  },
  */

  build: function(){
    $log("Game.Gui: initializing...", {section: 'open'});

    for(var container in $guiItems){
      var where = $(container);
      if(where.length == 0) continue; // skip section if the container does not exist

      //
      var guiId = container + '-gui';
      var gui = $(guiId);
      if(gui.length == 0){
        var guiContainer = $('<div id="' + guiId.substring(1) + '" class="gui">');  // .substring(1) removes the trailing #
        where.append(guiContainer);
        where = guiContainer;
      } else {
        where = gui;
      }

      $guiItems[container].each(function(item){
        item = $H(item);
        try{
          var name = item.getKeys()[0];
          var options = item[name];
          options.gui = where;
          var newItem = new Game.Gui[name](options);
          this.appendChild(newItem);
        } catch(err){
          $log('Game.Gui: error instantiating ' + name, {level: "error"});
          $log("Exception: " + err);
        }
      }, this);
    }

    WORLD.children.push(this);

    $log("Game.Gui: OK", {section: 'close'});
  },

  /* Gui assignment:
   * - actor.gui = actor.gui || GAME.gui
   * - if selector -> assigned actor.gui.selector
   * - if !selector -> assigned actor.gui
   **/
  appendChild: function(actor, selector){
    actor.gui = actor.gui || GAME.gui;
    selector = selector ? actor.gui.find(selector) : actor.gui;
    this.parent(actor, selector);
  },

  // Enables a modal panel. Put your modal GuiItem after calling this function.
  modal: function(enable){
    if(enable){
      GAME.gui.append("<div class='modal'></div>");
    } else {
      GAME.gui.find('.modal').remove();
    }
  }

});

/********************************************************************************/
/* Base class for all GUI items. It follows some convention:
 *
 * - item template is assigned in the options.template variable.
 * - gui property is is used when adding the element to the GUI and tells where to place the item.
 *   It is necessary because there can be many gui containers in the game desk. When the GUI is built,
 *   items receive the gui container directly from the game.gui.items declaration.
 * - After all this initializations the init(options) method is called, where you put your
 *   initialization code.
 *
 *   Options managed by Gui.Item:
 *   - template: custom item template name (without "-template")
 *   - subs: tamplate substitutions
 *   - anchor: you can modify actor anchoring
 *   - x, y: absolute coordinates, used only if the anchor.type == relative | absolute
 *
 * You can pass any other custom option to the item.
 **/
Game.Gui.Item = new Class({
  Extends: Core.DynamicActor,
  Implements: [Core.Dispatchable, Core.Templatable],
  name: "Gui Item",

  options: {
    template: 'none'
  },
  
  postfix: "-template",
  gui: null,  // a jQuery element

  initialize: function(options){
    if(!$defined(options)) options = {};

    if(options.template){ this.options.template = options.template; }
    if(options.anchor){ this.anchor = $H(this.anchor).extend(options.anchor).getClean(); }
    this.gui = options.gui;

    this.parent();
    this.build(options);
    this.init(options);
  },

  // Spawns the dom from the template, assigns it to the item and inserts item childs if any.
  build: function(options){
    var template = this.options.template;
    if(template != 'none') template += this.postfix;
    this.templetize(template, options.subs);

    // Positions the element
    options.x = options.x || 0;
    options.y = options.y || 0;
    this.positionTo(options.x, options.y);
  },

  // Propagates the gui assignment
  appendChild: function(actor, selector){
    actor.gui = this.gui;
    this.parent(actor, selector);
  },

  // Override this function to initialize your gui item.
  init: function(options){
  }

});
