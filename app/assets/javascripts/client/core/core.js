/* Gamecore mini js library for js game programming
 * Based on moo4q (mootools for jQuery)
 * © Algorithmica 2010
 */

/*********************************************************************
 *          Mootools singleton class with lazy instantiation
 *********************************************************************/
/* Singleton class pattern for mootools. The class is instanciated
 * by the first call to getInstance(), so it's safe to use even if you
 * need to instanciate it only after a document ready event.
 * Use example:
 *
 *  var MySingleton = new Class.Singleton({... standard mootools class definition ...});
 *  var istance = MySingleton.getInstance();
 *
 * you can also create singleton that accepts parameters (options hash) in their initialize:
 *
 *  var MySingleton2 = new Class.Singleton({
 *    Implements: Options,
 *    options: {
 *      initialState: 23
 *    },
 *    state: 0,
 *    initialize: function(options){
 *      this.setOptions(options);
 *      this.state = this.options.initialState;
 *    },
 *    ...
 *  });
 *
 * so you can customize the instance providing options to the first getInstance call:
 *
 *  var istance2 = MySingleton2.getInstance({initialState: 11});
 **/
Class.Singleton = new Class({
  klass: null,
  instance: null,
  initialize: function(classDefinition){
    this.klass = new Class(classDefinition);
  },
  getInstance: function(options){
    if(this.instance == null){
      this.instance = new this.klass(options);
    }
    return this.instance;
  }
});

/*********************************************************************
 * Adds html escaping and unescaping to String (copied from prototype)
 *********************************************************************/
String.implement({
  escapeHTML: function() {
    return this.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  unescapeHTML: function() {
    return this.stripTags().replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
  }
});

/*********************************************************************
 *                            THE CORE
 *********************************************************************/
var Core = Core || {}; // Core namespace

/* Extensions can put specific initializing code callbacks here, they
 * will be called in the Core.init() function. Use Core.extensionInitializer to
 * provide the init function for the extension. Example:
 *
 * -------top of the page--------
 * Core.extensionInitializer(function(){
 *    // Your code goes here
 * });
 *
 * ...
 * */
Core.initializers = [];
Core.extensionInitializer = function(callback){
  Core.initializers.push(callback);
}

/* Prepares the gloabl variable unrealCore and init core functions.
 * !!> Call it before using any core functions <!! */
Core.init = function(options) {
  // Used to assign unique objects id. Incremented on each instence.
  Core.nextObjectId = (new function(){
    var objectIdCounter = 0;
    this.get = function(){
      return objectIdCounter++;
    }
  }).get;

  options = options || {};
  if(options.debug) Konsole.enable(options.debug);
  if(options.log && Core.Logger){
    Core.logger = Core.Logger.getInstance();
    $log = Core.logger.log.bind(Core.logger);
  } else {
    Core.logger = null;
    $log = function(){};
  }
  $log('Core: initializing...', {section: 'open'});
  Core.frame = Core.MainFrame.getInstance();
  Core.scheduler = Core.Scheduler.getInstance(options);
  Core.initializers.each(function(initExtension){
    initExtension();
  });
  $log('Core: OK.', {section: 'close'});
}

/*********************************************************************/
// Predefined core events
Core.Events = {
  destroyed: 'destroyed'
}

/*********************************************************************
 *                            BASE CLASS
 *********************************************************************/
Core.Base = new Class({
  objectId: -1, // Unique object identifier,set in the initialize
  name: "Base",

  // Assigns an unique object id to every instance
  initialize: function(){
    this.objectId = Core.nextObjectId();
  },

  // Called on object destruction
  destroy: function(){
    // First removes all observed objects
    this.observed.each(function(obj){
      obj.observers.erase(this);
    }, this);
    this.observed = null;

    // Then removes me from observers observed array :) I don't need to be observed anymore as I'm dying
    this.observers.each(function(obj){
      obj.observed.erase(this);
    }, this);

    // Finally notifies my destruction to observers
    this.notifyObservers(Core.Events.destroyed);
    this.observers = null;
  },

  /***************************************/
  //  Core objects implement by default  //
  //      the observer pattern!          //
  /***************************************/

  // Observers collection (to notify with notifyObservers()
  observers: [],
  // Objects observed by me. I need it because I have to unobserve them if I'm destroyed.
  observed: [],

  /**************************************/
  // Observe an observable object (that implements Module.Observer)
  observe: function(observable){
    if(!observable.observers.contains(this)){
      observable.observers.push(this);
      this.observed.push(observable);
    }
  },
  // Stop observing an observable object (that implements Module.Observer)
  unobserve: function(observable){
    observable.observers.erase(this);
    this.observed.erase(observable);
  },

  /**************************************/
  /* Called by the observed object, override this method.
   * - observed: observed object that executed notifyObsevers
   * - event: optional parameter that specifies the type of notification (es: destroy, change, ...) */
  notify: function(observed, event){
    // Override me and do something useful ^_^
  },

  /* Notifies observers
   * - event: optional parameter to make a specific notification */
  notifyObservers: function(event){
    this.observers.each(function(observer){
      observer.notify(this, event);
    }, this);
  },
  
  toJSON: function(){
    return (this.name + " ID: " + this.objectId);
  }

});

/*********************************************************************
 *                            CORE CLASSES
 *********************************************************************/

/***************************** Scheduler *****************************/
// Used to fire any kind of timed tasks. For now it only manages animations.
Core.Scheduler = new Class.Singleton({
  Extends: Core.Base,
  Implements: Options,
  name: "Scheduler",

  options: {
    /* Animation frame per seconds. Don't rise it more than 1000/guard. */
    fps: 60,

    /* If an animation frame cannot be done within 1/fps, we could end up calling the tick
     * functions continuously freezing the browser. This guard is the minimum delay
     * that we assure between frames so that the browser can remain still responsive even if the
     * animation requires teoretically 100% cpu to try to keep the fps. */
    guard: 10
  },
  
  initialize: function(options){
    this.parent();
    $log('Core.Scheduler: initializing...', {section: 'open'});
    this.setOptions(options);
    /* Delay between animation frames in ms. Note: rounding introduces a 'small' error in
     * the frame rate. Error increases with higher frame rates because the error is always ±0.5,
     * and delay decrease with fps so error/delay increases. */
    this.animationDelay = (1000 / this.options.fps).round();
    this.toAnimate = new Hash; // Dynamic Actors that needs to be animated and are called at every frame.
    this.running = false;
    $log('Core.Scheduler: OK.', {section: 'close'});
  },

  // Call animate to add a dynamic actor to be animated. Static actors are ignored.
  animate: function(dynamicActor){
    if( (dynamicActor instanceof Core.DynamicActor) && (!this.toAnimate.get(dynamicActor.objectId)) ){
      this.toAnimate.set(dynamicActor.objectId, {
        actor: dynamicActor,
        time: (new Date).getTime()
        });
      if(!this.running){
        this.running = true;
        this.nextFrame(this.animationDelay);
      }
    }
  },

  /* Removes a dynamic actor from the animation queue, if there. Even If the scheduler is running
   * with this only dynamic actor it will automatically stop on the next schedule call. So it's safe
   * to remove any animated actor. */
  remove: function(dynamicActor){
    this.toAnimate.erase(dynamicActor.objectId);
  },

  // Performs scheduling
  schedule: function(){
    var start = (new Date).getTime();
    // animateActors() returns true if there are still actors that needs to be animated.
    this.running = this.animateActors();

    if(this.running){
      var nextDelay = this.animationDelay - ((new Date).getTime() - start);
      this.nextFrame(Math.max(this.options.guard, nextDelay));
    }
  },

  // Animates all the registered actors (in the animated hash)
  animateActors: function(){
    var time = 0;
    var dynamic = null;
    var animate = false;
    Core.scheduler.toAnimate.each(function(dynamic, id){
      time = (new Date).getTime();
      if(dynamic.actor.tick(time - dynamic.time)){
        dynamic.time = time;
        animate  = true;
      }else{
        // id actor's tick function returned false than we remove it from animated actors
        Core.scheduler.toAnimate.erase(id);
      }
    });
    return animate;
  },

  // Schedule next frame after delay time
  nextFrame: function(delay){
    setTimeout(Core.scheduler.schedule.bind(this), delay)
  },
  
  toJSON: function(){
    return (this.parent() + ", fps: " + this.options.fps + ", guard: " + this.options.guard + ", running: " + this.running);
  }

});

/*********************************************************************
 *                         DEBUGGING CORE
 *********************************************************************/
/* The Konsole is the basic debugger output.
 * You create one calling:
 *
 *    - Konsole.enable()
 * or
 *    - Konsole.enable(myCustomKonsoleObj)
 *
 * where myCustomKonsoleObj can be any object that implements the following method:
 *
 *    wirte(msg, type, escape)
 *
 * where:
 *    - msg: is the text to write to the console
 *    - type: ['info' | 'warn' | 'error' | 'log'] specifies the text type so different styles can be applied
 *    - escape: [true | false] specifies if the text must be escaped or no (typically it means html escaping
 *              but it's up to you)
 *
 * If you do not specify a myCustomKonsoleObj, Konsole out will be redirected to the standard console
 * using the default Konsole.Base.
 *
 * You write to the output using these methods:
 *
 *    - Konsole.info(msg, escape)
 *    - Konsole.warn(msg, escape)
 *    - Konsole.error(msg, escape)
 *    - Konsole.log(msg, escape)
 *
 * Konsole.view refers to the Konsole object used so you have always a reference to it.
 **/
var Konsole = Konsole || { // Standard javascript
  view: null, // Any object that has write(msg, type, escape) function.
  timestamp: true,  // [true | false] adds or not a timestamp
  info: function(msg, escape){
    Konsole.view && Konsole.view.write(msg, 'info', escape);
  },
  warn: function(msg, escape){
    Konsole.view && Konsole.view.write(msg, 'warn', escape);
  },
  error: function(msg, escape){
    Konsole.view && Konsole.view.write(msg, 'error', escape);
  },
  log: function(msg, escape){
    Konsole.view && Konsole.view.write(msg, 'log', escape);
  },

  /* Enables or disables the console.
   * consoleObj: [true|false|Konsole.* instance]
   * If true, makes a Konsole.Base or uses the specific Konsole object if provided.
   * If false disables the console. */
  enable: function(consoleObj){
    if(consoleObj == undefined) consoleObj = true;

    // Removes an already existing Konsole if any.
    if(Konsole.view){
      if(Konsole.view.element){
        Konsole.view.destroy(); // It's an Actor, so we must call it's destroy() function that removes the DOM element.
      } else {
        delete Konsole.view; // It's a non Actor object and we can simply delete it
      }
      Konsole.view = null;
    }

    // Creates a Konsole if requested and if the debugging module is included.
    if(consoleObj && Konsole.Base){
      // Deletes an existing console if any
      // Creates the requested console (NOTE Konsole.Base is not in the Core)
      Konsole.view = (consoleObj == true ? new Konsole.Base : consoleObj);
      // If the console is an Actor, attaches it to the MainFrame
      if(Konsole.view.element) Core.frame.appendChild(Konsole.view);
    }

    return Konsole.view;
  }
};

/* Base debugging facility. Messages are shown in the javascript console. */
Konsole.Base = new Class({
  write: function(msg, type){
    switch (type) {
      case 'info':
        console.info(msg)
        break;
      case 'warn':
        console.warn(msg)
        break;
      case 'error':
        console.error(msg)
        break;
      default:
        console.log(msg)
        break;
    }
  }
});


