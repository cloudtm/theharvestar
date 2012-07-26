/********************************************************************************
 *                         Resource Selector classes
 ********************************************************************************/
/*  Optional parameters:
 *  - resources (default all to 0): resource hash {energy: 9, titanium: 2, ...}
 *  - editable (default true): editable mode boolean. If true the selector will open in editable mode, otherwise will be closed.
 *  - max (default false): N or false, if N the selector will not allow to select more than N resources for each counter.
 *  - min (default false): N or false, if N the selector will not allow to select less than N resources for each counter.
 *  - cycle (default false): [true | false], if max && min, cycle allows the counter to go from max => min or min >= max.
 *  - maxSum (default false): N > 0 or false, if N the sum will be upper bound to N.
 **/
Game.Gui.ResourceSelector = new Class({
  Extends: Game.Gui.Item,
  name: "ResourceSelector",

  options: {
    template: 'resource-selector',
    zeroClass: 'zero',
    changeSpeed: 250, // animation changing speed between editable and non editable
    editable: true,   // default editable mode, depends on css
    max: false,
    min: false,
    cycle: false
  },

  init: function(options){
    this.parent(options);
    
    // Setup constrains
    $defined(options.max) && (this.options.max = options.max);
    $defined(options.min) && (this.options.min = options.min);
    if(this.options.max && this.options.min){
      if(this.options.min > this.options.max) this.options.min = this.options.max;
      options.cycle && (this.options.cycle = options.cycle);
    }
    this.maxSum = options.maxSum ? Math.abs(options.maxSum) : false;
    
    // Check if contrains conflicts
    if(this.conflicts()) return;
    
    // Initialize the selector data
    this.selection = CONFIG.resourceSet().extend(options.resources);
    this.constrain();
    this.snapshot = $H(this.selection); // the snapshot matches the starting selection
    this.editable = this.options.editable;
        
    // Makes buttons
    // Possible accessing modes: this.buttons.up.res, this.buttons.down.res,  this.buttons.res.up, this.buttons.res.down
    this.buttons = new Hash({up: new Hash, down: new Hash});
    CONFIG.resourceSet().getKeys().each(function(res){
      var btnUp = new Game.Gui.Button({
        anchor: {custom: 'up'},
        call: this.up.bind(this),
        template: 'none',
        klass: 'button',
        text: false,
        sounds: {mousedown: $fx.gui.select},
        store: res
      });
      var btnDown = new Game.Gui.Button({
        anchor: {custom: 'down'},
        call: this.down.bind(this),
        template: 'none',
        klass: 'button',
        text: false,
        sounds: {mousedown: $fx.gui.select},
        store: res
      });
      
      // Organize the buttons in the button hash for easy access
      this.buttons.up.set(res, btnUp);
      this.buttons.down.set(res, btnDown);
      
      // Creates all the elements for the current resource selector counter
      var counter = this.element.find('.' + res);
      counter.append($('<div class="editbkg">'));  // Contains the resource count
      counter.append($('<span>'));  // Contains the resource count
      this.appendChild(btnUp, counter);
      this.appendChild(btnDown, counter);
    }, this);
    
    // edit selectors for animation
    this.animatable = {
      counters: this.element.find('.counters'),
      bkg: this.element.find('.editbkg'),
      buttons: this.element.find('.button')
    };
    
    this.element.find('.resource').click(this.tap.bind(this));
    
    // Finally we render the selector
    this.update();
    
    /* Adjust edit mode. If options.editable is false we must close the selector that is open by default. */
    if(options.editable === false){
      var ani = this.animatable;
      ani.counters.removeClass('edit');
      ani.bkg.hide();
      ani.buttons.hide();
      this.editable = false;
    }
  },
    
  /*****************************************************************************/
  // BUTTONS Management. Buttons fires notifications to observers!
  up: function(event, res){
    this.selection[res]++;
    // cycle == true ensures that there is a max and min
    if(this.options.cycle && this.selection[res] > this.options.max) this.selection[res] = this.options.min;
    this.update();
    var sum = this.sum();
    this.notifyObservers({
      type: 'up',                 // button pressed
      resource: res,              // resource selected
      count: this.selection[res], // total resources count for that type
      sum: sum,                   // algebric sum of all resources in the selector
      any: this.any(),            // any resource selected? (at least a non 0 selection)
      balanced : (sum == 0)       // is the sum == 0?
    });
  },
  
  down: function(event, res){
    this.selection[res]--;
    // cycle == true ensures that there is a max and min
    if(this.options.cycle && this.selection[res] < this.options.min) this.selection[res] = this.options.max;
    this.update();
    var sum = this.sum();
    this.notifyObservers({
      type: 'down',               // button pressed
      resource: res,              // resource selected
      count: this.selection[res], // total resources count for that type
      sum: sum,                   // algebric sum of all resources in the selector
      any: this.any(),            // any resource selected? (at least a non 0 selection)
      balanced: (sum == 0)        // is the sum == 0?
    });
  },
  
  // Click on the counters bar when the selector is closed
  tap: function(event){
    event.stopPropagation();
    if(this.editable) return;
    this.notifyObservers({type: 'tap'});
  },
  
  /*****************************************************************************/
  // SNAPSHOT Management
  save: function(){
    this.snapshot.extend(this.selection);
  },
  
  revert: function(){
    this.selection.extend(this.snapshot);
    this.update();
  },
  
  isChanged: function(){
    return this.selection.some(function(count, res){
      return this.snapshot[res] != count;
    }, this);
  },
  
  /*****************************************************************************/
  // UTILITIES
  // Returns true when the sum of the resources is zero
  isBalanced: function(){
    return (this.sum() == 0);
  },
  
  // Returns the rsources sum.
  sum: function(){
    var sum = 0;
    this.selection.each(function(count, res){
      sum += count;
    });
    return sum;
  },
  
  // Returns if there is at least one resource selected (not 0).
  any: function(){
    return this.selection.some(function(count, res){
      return count != 0;
    });
  },
    
  /*****************************************************************************/
  // EDIATBILITY
  // Enters o leaves edit mode
  edit: function(editable){
    editable = $defined(editable) ? editable : true;
    if(editable == this.editable) return;
    this.editable = editable;
    
    var ani = this.animatable;
    var speed = this.options.changeSpeed;
    
    if(editable){
      ani.counters.addClass('edit');
      ani.bkg.stop(true).fadeIn(speed);
      ani.buttons.stop(true).fadeIn(speed);
    } else {
      ani.counters.removeClass('edit');
      ani.bkg.stop(true).fadeOut(speed);
      ani.buttons.stop(true).fadeOut(speed);
    }
  },
  
  /*****************************************************************************/
  // SETTERS
  
  setResources: function(resources){
    this.selection = CONFIG.resourceSet().extend(resources);
    this.constrain();
    this.update();
  },
  
  // Updates maxSum and re-enforces the selector
  setMaxSum: function(sum){
    var temp = this.maxSum;
    this.maxSum = sum;
    
    if(this.conflicts()){
      this.maxSum = temp;
      return;
    }
    
    this.constrain();
    this.update();
  },
  
  /*****************************************************************************/
  // PRIVATES
  
  /* Updates the visualization of the selector  */
  update: function(){
    // Updates counters
    this.selection.each(function(count, res){
      var resource = this.element.find('.' + res);
      resource.find('span').html(count);
      count == 0 ? resource.addClass(this.options.zeroClass) : resource.removeClass(this.options.zeroClass);
    }, this);
    this.enforce();
  },
  
  /* Enforces the constraints enabling/disabling buttons */
  enforce: function(){
    var max = this.options.max, min = this.options.min, cycle = this.options.cycle;
    // Step 1: enforce max and min if !cycle
    if(!cycle && (max !== false || min !== false)){
      this.selection.each(function(count, res){
        max === false || count < max ? this.buttons.up[res].enable() : this.buttons.up[res].enable(false);
        min === false || count > min ? this.buttons.down[res].enable() : this.buttons.down[res].enable(false);
      }, this);
    }
    // Step 2: enforce maxSum. Only disables them when needed. Previous step reenables them.
    if(this.maxSum !== false){
      if(this.sum() >= this.maxSum){
        this.enable(this.buttons.up, false);
      } else if(cycle){  // restores unable state for up buttons if cycle is true because the step 1 is skipped
        this.enable(this.buttons.up, true);
      }
    }
  },
  
  /* Constrain all resources to match upper / lower limits and maxSum. */
  constrain: function(){
    var sum = 0;
    this.selection.each(function(count, res){
      var limited = this.options.max === false ? count : Math.min(count, this.options.max);
      limited = this.options.min === false ? limited : Math.max(this.options.min, limited);
      this.selection[res] = limited;
      sum += limited;
    }, this);
    // If the default sum exceed the maxSum then we reset all the counters to 0 or this.options.min if it's > 0.
    if(this.maxSum !== false && sum > this.maxSum){
      this.selection.each(function(count, res){
        this.selection[res] = (this.options.min > 0) ? this.options.min : 0;
      }, this);
    }
  },
  
  /* Conflicts between the constrains? */
  conflicts: function(){
    if(this.maxSum !== false && this.options.min && (this.options.min * 5 > this.maxSum)){
      $log("Game.Gui.ResourceSelector: min constrain on resources excheeds maxSum!",{level: "error"});
      return true;
    }
    return false;
  },
  
  // Enables hyerarcycally buttons. Example: enable(this.buttons.up, true), enable(false), enable(this.buttons.up.energy, false)
  enable: function(obj, bool){
    bool = $defined(bool) ? bool : true;
    switch($type(obj)){
      case 'boolean':
        this.enable(this.buttons, obj);
        break;
      case 'hash':
        obj.each(function(obj, key){
          this.enable(obj, bool);
        }, this);
        break;
      case 'object':
        obj.enable(bool);
        break;
    }
  }

});

/********************************************************************************
 *                              Button class
 ********************************************************************************/
/* Button
 * Button has 4 states: normal, hover, active and disabled.
 * Accepted params:
 *
 * - x: x coordinate (coordinate system depends on your css)
 * - y: y coordinate (coordinate system depends on your css)
 *
 * Optional parameters:
 *
 * - call: callback(event, store) that will be called (function(event){...}). This callback will be called for
 *         every event listened by the button (by default 'click'). If you want to specify a different
 *         callback for each event, use a hash like this: {click: clickCallback, hover: hoverCallback...}.
 *         The callback will receive 2 parameters: event and store (see below).
 * - events (default ['click']): array of event to notify, example: ['click', 'doubleclick']
 * - enabled (default true): default button state [true | false]
 * - text (default 'Button'): button text. Set it to false if you don't want text over the button.
 * - handle: selector string that specifies where to attach the event.
 * - klass: a class to add to the button. It allows for example to instantiate buttons with template 'none'
 *          and control their appearance through this class (use the image-button mixin to define quickly
 *          an image button). Tip: you can also set anchor.type to define a button class, example: anchor: {type: 'myclass'}
 *          (see the above ResourceSelector for some live examples).
 * - sounds: map of event => sound (can be null if you do not want any sound). Default: {mousedown: $fx.gui.buttonClick}.
 * - store: any kind of data to be stored in the button for later retrival. Possible use is to differentiate buttons.
 *
 * If you don't provide a callback, you will be notified with the observer
 * pattern. In this case you have to observe the button and then verify that
 * the received event is what you expect to be (not for example a destroy event).
 * 
 * You can enable or disabel the button calling enable. Example:
 * 
 *    1. var button = new Game.Gui.Button({x: 100, y:200, call: myCallback, template: 'myTemplateID' })
 *    2. button.enable(false)
 *    3. button.enable(true)
 *
 * 1. instantiates the button assigning a template and a callback.
 * 2. disables the button
 * 3. re enables the button.
 *
 * The button has 'enabled' or 'disabled' classes when enabled or disabled, so you can style it.
 * See the _button.scss for
 **/
Game.Gui.Button = new Class({
  Extends: Game.Gui.Item,
  name: "Button",

  options: {
    template: "none",
    enabledClass: "enabled",
    disabledClass: "disabled",
    events: ['click'],          // listened events
    enabled: true,
    text: 'Button'
  },

  init: function(options){
    this.callback = options.call; // Saves the callback if any
    this.enabled = $defined(options.enabled) ? options.enabled : this.options.enabled; // Sets the starting button state
    this.toggler = this.options.enabledClass + " " + this.options.disabledClass;  // Buttons enabled state toggler
    this.store = options.store; // Saves the optional data

    // Sets button state
    this.enabled ? this.element.addClass(this.options.enabledClass) : this.element.addClass(this.options.disabledClass);
    
    // Assigns text label to the button (can be false, that's why I use the $defined method)
    var label = $defined(options.text) ? options.text : this.options.text;
    if(label) this.element.html(label);
    if(options.klass) this.element.addClass(options.klass);
    
    // Prepares the sound events
    this.sounds = (options.hasOwnProperty('sounds') ? options.sounds : {mousedown: $fx.gui.buttonClick});
    var sounds = this.sounds ? $H(this.sounds).getKeys().map(function(event){return (event + '.gui.button');}).join(' ') : null;

    /* Binds events ***************************************/
    // Creates the event hash.
    var eventMap = {};
    this.events = options.events || this.options.events;
    this.events.each(function(event){
      eventMap[event] = this.notifyEvent.bind(this);
    }, this);
    
    // Binds the event hash and sound events to the right element (handle or the whole button element)
    if(options.handle){
      var handle = this.element.find(options.handle);
      handle.on(eventMap);
      if(sounds) handle.on(sounds, this.soundEvent.bind(this));
    } else {
      this.element.on(eventMap);
      if(sounds) this.element.on(sounds, this.soundEvent.bind(this));
    }
  },

  enable: function(enabled){
    enabled = $defined(enabled) ? enabled : true;
    if(this.enabled == enabled) return;   // State does not change => do nothing

    this.enabled = enabled;
    this.element.toggleClass(this.toggler);
  },

  notifyEvent: function(event){
    if(this.enabled){
      if(this.callback){
        if($type(this.callback) == 'function'){
          this.callback(event, this.store);
        } else {
          var call = this.callback[event.type];
          if(call) call(event, this.store);
        }
      } else {
        this.notifyObservers({event: event, store: this.store});
      }
    }
    event.stopPropagation();
  },
  
  soundEvent: function(event){
    if(this.enabled) $send($msg.audio.fx, this.sounds[event.type]);
    event.stopPropagation();
  }
});

/********************************************************************************/
/* This button has multiple states and for each state calls a different callback.
 * When instanciating one, you have to pass the states with associated callbacks
 * and a transition map. The button internally uses a Core.FSM to handle states so
 * refer to it for more infos.
 *
 * States and transitions adds 2 additional required parameters to the button options:
 *
 * - states: array of states, example: [{name: 'execute', call: callback}, {name: 'wait'}, ...].
 *   The first state will be the initial state. Each state is associated with a callback. If you do not
 *   specify the callback, the button will be disabled in that state. States syntax is the same of
 *   addState() in Core.FSM, with added 'call' key. So you can also specify enter and leave callbacks.
 *
 * - transitions: array of transitions, example: [{from: 'execute', to: 'wait', event: 'go'}, ... ]
 *   where from is the starting state, to is the destination state and event is the event that
 *   triggers the transition change. You can also specify an allowed and a doing callbacks. See
 *   Core.FSM addTransition() method for more infos.
 *
 * At every state the button will receive the class of the state.
 * To change state use event(eventName) method.
 * */
Game.Gui.StateButton = new Class({
  Extends: Game.Gui.Button,
  name: "StateButton",

  init: function(options){
    this.parent(options);

    /* For every state saves here its 'call', 'enter' and 'leave' callbacks.
     * They are used in the enterState and leaveState methods to make appropriate calls. */
    this.stateMap = {};
    this.fsm = new Core.FSM;

    // __start__ is used with an instant transition to initialize the button
    this.fsm.addState({name: '__start__'});
    var initialState = null;
    options.states.each(function(state){
      var stateName = state.name;
      if(!initialState) initialState = stateName;
      this.fsm.addState({
        name: stateName,
        enter: this.enterState.bind(this),
        leave: this.leaveState.bind(this)
      })
      // Saves the callbacks for later use.
      delete state.name;
      this.stateMap[stateName] = state;
    }, this)

    // The button get initialized with an instant transition
    this.fsm.addTransition({from: '__start__', to: initialState});
    // Transitions are easy, just passed to fsm addTransition
    options.transitions.each(function(transition){
      this.fsm.addTransition(transition);
    }, this)

    this.fsm.start();
  },

  event: function(event){
    this.fsm.event(event);
  },

  enterState: function(stateName){
    this.element.addClass(stateName);
    var state = this.stateMap[stateName];
    this.callback = state.call;
    this.callback ? this.enable(true) : this.enable(false);
    if(state.enter) state.enter(stateName);
  },

  leaveState: function(stateName){
    this.element.removeClass(stateName);
    var state = this.stateMap[stateName];
    if(state.leave) state.leave(stateName);
  }
});

 /* Dialog OPTIONAL params:
  * - width (default min width in css): dialog width;
  * - height (default min height in css): dialog height;
  * - center: dom element used to center the dialog (centers it in the middle of the element)
  * 
  * Dialog FUNCTIONS:
  * - close(): closes safely the dialog (unbinding events). Use this function to close the dialog.
  **/
//*****************************************************//
Game.Gui.Dialog = new Class({
   Extends: Game.Gui.Item,
   name: "Dialog",

   options: {
     template: 'dialog'
   },
   
   init: function(options){
     this.parent(options);
     if(options.width) this.element.width(options.width);
     if(options.height) this.element.width(options.height);
     this.centerRef = options.center || window;
     
     // Close on ESC
     var escape = function(event){
       if (event.keyCode == 27) this.close();
     }
     $(document).on('keyup.gui.dialog', escape.bind(this));
   },
   
   close: function(event){
     $(document).off('keyup.gui.dialog');
     this.destroy();
   },

   afterAppend: function(){
     /* If I do it in the init it appends a positions:relative online in the style (don't know why). */
     this.element.draggable({
       handle: '.handle',
       //opacity: 0.8,
       containment: 'window'
     });
     this.element.position({
       of: this.centerRef,
       my: 'center center',
       at: 'center center'
     });
   }
 });
 
/********************************************************************************
 *                         Placer Tracer debug facility
 ********************************************************************************/
Game.Gui.PlacerTracer = new Class({
  Extends: Game.Gui.Item,
  name: "PlacerTracer",

  options: {
    template: 'placer-tracer'
  },

  tracing: false,
  tracedElement: null,

  init: function(options){
    this.element.draggable();
    this.showX = this.element.find('.x');
    this.showY = this.element.find('.y');
    this.showInfo = this.element.find('.info');
    WORLD.element.on({
      'mousedown.placer': this.startTrace.bind(this),
      'mouseup.placer': this.stopTrace.bind(this)
    });
  },

  destroy: function(){
    WORLD.element.off('mousedown.placer mouseup.placer');
    this.parent();
  },

  startTrace: function(event){
    this.tracedElement = this.findWithId($(event.target));
    if(this.tracedElement){
      // collects and shows some info ebout the actor
      this.actor = WORLD.getActor(this.tracedElement.attr('id'));
      var info = this.collectInfo(this.actor);
      this.showInfo.html(info);

      // Saves tracing information
      this.tinfo = {
        anchorX: this.actor.anchor.x,
        anchorY: this.actor.anchor.y,
        startX: event.pageX,
        startY: event.pageY,
        currentX: parseInt(this.tracedElement.css(this.actor.anchor.x)),
        currentY: parseInt(this.tracedElement.css(this.actor.anchor.y)),
        dirX: (this.actor.anchor.x == 'left' ? 1 : -1),
        dirY: (this.actor.anchor.y == 'top' ? 1 : -1)
      };

      this.tracing = true;
      this.trace(event);

      WORLD.element.on('mousemove.placer', this.trace.bind(this));
    }
  },

  collectInfo: function(actor){
    var acceptedKeys = ['string', 'number', 'boolean'];
    var acceptKey = function(key){
      return acceptedKeys.contains($type(key));
    }

    var info = $H(actor).filter(function(key){return acceptKey(key);});
    if(actor.observers.length > 0){
      info.set('observers', actor.observers.map(function(observer){
        return observer.objectId;
      }));
    } else {
      info.set('observers', 0);
    }
    if(actor.options){
      info.set('options', $H(actor.options).filter(function(key){return acceptKey(key);}));
    }
    return $("<pre>").html(JSON.stringify(info, null, ' '));
  },

  findWithId: function(element){
    var id = element.attr('id');
    // We check for id because traversing parents we could come up to Document.
    if(id && id.length > 0 && parseInt(id)){
      return element;
    }
    if(element.length == 0) return null;  //end of parents :)
    return this.findWithId(element.parent())
  },

  trace: function(event){
    if(this.tracing && this.actor){
      var posX = (event.pageX - this.tinfo.startX) * this.tinfo.dirX + this.tinfo.currentX;
      var posY = (event.pageY - this.tinfo.startY) * this.tinfo.dirY + this.tinfo.currentY;
      // Drags the object
      var newPos = {};
      newPos[this.tinfo.anchorX] = posX;newPos[this.tinfo.anchorY] = posY;
      this.tracedElement.css(newPos);
      // Shows new object coordinates
      this.showX.html(posX);
      this.showY.html(posY);
    }
  },

  stopTrace: function(event){
    WORLD.element.off("mousemove.placer");
    this.tracing = false;
    this.tracedElement = null;
    this.actor = null;
  }

});