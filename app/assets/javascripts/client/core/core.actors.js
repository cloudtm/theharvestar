/***************************** Actor *****************************/
// The Actor is a DOM element and it's Scene Graph is the DOM itself
Core.Actor = new Class({
  Extends: Core.Base,
  name: "Actor",
  
  /* Anchor defines the coordinate system of the Actor. It tells what means x and y.
   * If you specify a custom anchor then no position style will be added and x and y coordinates will
   * not be used but the custom anchor will be added as class to the element.
   **/
  anchor: {x: 'left', y: 'top', custom: null},
  element: null,  // The dom element used to represent this actor in the browser.
  x: 0,           // In pixels. The coordinate system depends on the anchor (see anchor property)
  y: 0,           // In pixels. The coordinate system depends on the anchor (see anchor property)
  children: [],   // My children (Actors)
  parentActor: null, // My parent.
  dirty : true,   // Dirty flag is true when the Actor needs to be redrawn, false if not.
  propagatedDestroy: false, // used to handle correctly child destruction.

  initialize: function(){
    this.parent();
  },
  
  /* Called by the subclasses to create the dom element for this actor.
   *  obj:
   *    1) '<div>', '<img>' or other tags
   *    2) a standard dom element
   *    3) a jQuery element
   *  options: {..} attributes used to create the element if obj specifies a tag (1)
   * Example:
   *  this.assign('<div>', {id: 'elementID'});
   **/
  assign: function(obj, options){
    switch($type(obj)){
      case 'string':
        this.element = jQuery(obj, options);
        break;
      case 'element':
        this.element = jQuery(obj);
        break;
      case 'object':
        if(obj.jquery){
          this.element = obj
          break;
        }
      default:
        $log('Core.Actor: Invalid element assigned to the actor ' + this.objectId, {level: 'error'});
        throw 'Core.Actor: Invalid element';
    }
    if(this.element){
      this.element.attr({
        id: this.objectId
      });
      // Specifies a custom anchor class. In this case coordinates will not be used to place the object.
      if(this.anchor.custom) this.element.addClass(this.anchor.custom);
    }
    return this.element;
  },

  /* Removes the dom element and removes this istance from parent children.
   * When no one references this istance anymore it will be garbage collected.
   * ALERT: DO NOT destroy inside a loop, like:
   *
   *    actor.children.each(function(child){ child.destroy(); })
   *
   * as each child removes its rference from parent changing the children array itself.
   * As result, non all childs will be destroyed. Use empty() to do that! */
  destroy: function(){
    this.children.each(function(child){
      child.propagatedDestroy = true;
      child.destroy();
    });
    if(!this.propagatedDestroy){
      if(this.element) this.element.empty().remove(); // all events are also unbound
      if(this.parentActor) this.parentActor.children.erase(this);
    }
    this.children = null;
    this.parent();
  },

  // Removes all children
  empty: function(){
    this.children.each(function(child){
      child.propagatedDestroy = true;
      child.destroy();
    });
    this.element.empty();
    this.children.empty();
  },

  /* Setta le coordinate dell'Actor senza ridisegnarlo.
   * Il sitema di coordinate dipende dallo stile css. Usando absolute
   * x ed y sono relative al primo parent che ha definito lo stile 'position'. */
  positionTo: function(x, y){
    this.x = x;
    this.y = y;
    this.dirty = true;
  },

  // Come il positionTo ma in aggiunta ridisegna l'oggetto
  moveTo: function(x, y){
    this.positionTo(x, y);
    this.draw();
  },

  moveRelativeTo: function(dX, dY){
    this.x += dX;
    this.y += dY;
    this.dirty = true;
    this.draw();
  },

  /* Appends an Actor to this one.
   * The actor will be pushed in this actor children, its' element will be appended
   * to this actor element, will be drawn and finally it's afterAppend will be called.
   * Parameters:
   *
   * - child: the child to append
   * - selector: optional selector string that defines where to append the child.
   *
   * If you do not specify a selector, the child element will be (jquery) appended to this
   * actor element, so it will appear as a direct child in last position. If you specify
   * a selector, it will be used to select a precise element node where to append the child
   * element.
   **/
  appendChild: function(child, selector){
    var container;
    this.children.push(child);

    if(this.element){
      container = selector ? this.element.find(selector) : this.element;
    } else {
      container = selector ? $(selector) : null;
    }
    if(container) container.append(child.element);

    child.parentActor = this;
    child.dirty = true;
    child.draw();
    child.afterAppend();
    return this;
  },

  // Like appendChild, but prepends it
  prependChild: function(child, selector){
    var container;
    this.children.unshift(child);

    if(this.element){
      container = selector ? this.element.find(selector) : this.element;
    } else {
      container = selector ? $(selector) : null;
    }
    if(container) container.prepend(child.element);

    child.parentActor = this;
    child.dirty = true;
    child.draw();
    child.afterAppend();
    return this;
  },

  afterAppend: function(){
  // Use it in subclasses to execute actions after the Actor was added to the dom.
  },

  /* Il  draw di default imposta le coordinate correnti (il sistema di riferimento dipende dal css)
   * e ridisegna se stesso e tutti i figli.
   * Ogni attore poi può aggiungere o personalizzare la funzione di draw. */
  draw: function(){
    // Not the best way to implement dirty flag, should be in the logic of the calling method
    // not in the draw itself, but here we need to propagate draw to children
    if(this.dirty){
      if(!this.anchor.custom){
        var pos = {};
        pos[this.anchor.x] = this.x +'px';
        pos[this.anchor.y] = this.y +'px';
        this.element.css(pos);
      }
      this.dirty = false;
    }

    this.children.each(function(child){
      child.draw();
    });
  },
  
  toJSON: function(){
    return (this.parent() + ", children: " + this.children.length + ", anchor: {" + this.anchor.custom + ", " + this.anchor.x + ", " + this.anchor.y + "}, x: " + this.x + ", y: " + this.y + ", width: " + this.element.width() + ", height: " + this.element.height());
  }

});

/***************************** StaticActor *****************************/
// Static actors cannot be animated
Core.StaticActor = new Class({
  Extends: Core.Actor,
  name: "StaticActor"
});

/***************************** DynamicActor *****************************/
// Dynamic actors can be animated
Core.DynamicActor = new Class({
  Extends: Core.Actor,
  name: "DynamicActor",

  destroy: function(){
    Core.scheduler.remove(this);
    this.parent(); // excecutes Actor's remove
  },

  // Schedules this actor for animation. Animation stops when tick returns false.
  animate: function(){
    Core.scheduler.animate(this);
  },

  // delta: ms passed since last call
  tick: function(delta){
    return false;
  }
});

/***************************** SpriteActor *****************************/
Core.SpriteActor = new Class({
  Extends: Core.DynamicActor, // Derived from dynamic actor so it could be animated if necessary
  name: "SpriteActor",

  /* animation:
   * {
   *  start: "name of the first animation strip to play",
   *  strips: {
   *    normal: {                   => animation strip name (used also in the next parameter)
   *      frame: {w:10, h:10},      => width and height of the animation frame
   *      pos: {x:0, y:100},        => starting position in the sprites textures (background-postion)
   *      seq: [0,1,2,1,5,4,3,4,5], => sprite sequence
   *      cycles: [n | "3..7"]      => if number: how many time to sycle (<0 means forever, 0 means fixed frame, >0 defines a cycle number)
   *                                   if string: than a range definition is expected. It will cycle a rondom number of times in the range, then go to next animation.
   *      rand: [true | false]      => defines if the frames in the sequence are randomly picekd up
   *      fps: 10,                  => animation fps
   *      next: [null | "next animation strip"] => if null, the animation will pause, otherwise it will try to play the named animation.
   *    },
   *    another : { ... },
   *    ...
   *  }
   * }
   *
   **/

  animation: {},
  playing: false,
  stripes: null,
  timer: null,

  setAnimation: function(ani){
    if(!ani){
      $log("SpriteActor: no animation defined", {level: "error"});
      return;
    }
    this.stripes = ani.stripes;
    this.play(ani.start);
  },

  // - name (optional): start to play the named animation. If not present it will continue to play current animation.
  play: function(name){
    var ani = this.animation;

    if(name){
      if(this.playing){
        if(name == ani.name) return;  // this animation is already playing => do nothing
        if(!this.load(name)) return;  // failed to load => do nothing (error is logged)
        this.resync(ani.fps);
      } else {
        if(name == ani.name){
          this.resume();
          return;
        }
        if(!this.load(name)) return;  // failed to load => do nothing (error is logged)
        this.step();  // Loads the first animation frame
        if(!this.animation.steady) this.resume();
      }
    } else {
      // If already playing or there is no loaded animation => do nothing
      if(this.playing || !ani.name) return;
      this.resume();
    }
  },

  // stops the current animation
  pause: function(){
    if(this.playing){
      clearInterval(this.timer);
      this.timer = null;
      this.playing = false;
    }
  },

  // steps a frame in the animation
  step: function(){
    var ani = this.animation;
    if(ani.frame >= ani.length){
      ani.frame = 0;
      ani.cycle++;
      this.newCycle();
    } else {
      this.render();
      ani.frame++;
    }
  },
  
  /* Callad by the load function and overriddable to adjust actor positioning.
   * All animation parameters can be accessed from this.animation.
   * Default behavior is to recenter the actor. */
  frameResized: function(){
    var ani = this.animation;
    var pos = {
      x: -(ani.frameW >> 1) + ani.offsetX,
      y: -(ani.frameH >> 1) + ani.offsetY
    }
    this.moveTo(pos.x, pos.y);
  },
  
  /* Callad by the load function after the animation parameters are all set.
   * You can change parameters on the flay here. */
  animationLoaded: function(name){
  },

  /**********************************************************************
   *                            PRIVATES
   **********************************************************************/

  resume: function(){
    if(!(this.playing || this.animation.steady)){
      this.timer = setInterval(this.step.bind(this), this.animation.delay);
      this.playing = true;
    }
  },

  // Loads the new strip into the working parameters
  load: function(name){
    var strip = this.stripes ? this.stripes[name] : null;
    // if there is no animation for the passed name => do nothing
    if(!strip){
      $log("SpriteActor: No animation named \"" + name + "\"", {level: "error"});
      return false;
    }
    
    var oldW = this.animation.frameW, oldH = this.animation.frameH;
    var newW = strip.frame.w, newH = strip.frame.h;
    var oldOffX = this.animation.offsetX, oldOffY = this.animation.offsetY;
    var newOffX = strip.offset ? strip.offset.x : 0;
    var newOffY = strip.offset ? strip.offset.y : 0;
        
    this.animation = {
      name: name,
      posX: strip.pos.x,
      posY: strip.pos.y,
      offsetX: newOffX,
      offsetY: newOffY,
      frameW: newW,
      frameH: newH,
      frames: strip.seq,
      frame: 0,
      length: strip.seq.length,
      fps : strip.fps || 0,
      delay: (strip.fps ? (1000 / strip.fps) : null),
      cycles: this.calcCycles(strip),
      cycle: 0,
      rand: strip.rand ? strip.rand : false,
      steady: strip.cycles == 0,
      next: strip.next
    }
    
    // calls the after loaded filter
    this.animationLoaded(name);
    
    // Sets the frame size
    if(newW == oldW && newH == oldH){
      if(!(newOffX == oldOffX && newOffY == oldOffY)) this.frameResized();
    } else {
      this.element.css({width: this.animation.frameW, height: this.animation.frameH});
      this.frameResized();
    }
    return true;
  },

  // Parses the cycles parameter and generates random cycles if cycles is a range (ex: "2..4")
  calcCycles: function(strip){
    var cycles = 0;
    if($type(strip.cycles) == "string"){
      var range = strip.cycles.split("..");
      var low = parseInt(range[0]), high = parseInt(range[1]);
      if(range.length == 2 && high > low){
        cycles = low + Math.round(Math.random() * (high - low));
      } else {
        $log("SpriteActor: Bad range definition in animation => " + strip.cycles, {level: "error"});
      }
    } else {
      cycles = strip.cycles;
    }
    return cycles;
  },

  /* Resyinc the timer to match the new strip fps, continuing the animation
   * - fps: the current used fps */
  resync: function(prevFps){
    if(this.playing){
      this.step();  // renders the first frame of the next animation
      if(this.animation.steady){
        this.pause();
        return;
      }
      if(this.animation.fps != prevFps){
        clearInterval(this.timer);
        this.timer = setInterval(this.step.bind(this), this.animation.delay);
      }
    }
  },

  newCycle: function(){
    var ani = this.animation;
    if(ani.cycles > 0){
      if(ani.cycle >= ani.cycles){
        ani.next ? this.play(ani.next) : this.pause();
      }
    } else {
      this.step();  // infinitie loop => steps to the first animation frame again
    }
  },

  render: function(){
    var ani = this.animation;
    if(ani.rand){
      var frame = Math.floor(Math.random() * ani.frames.length);
    } else {
      frame = ani.frames[ani.frame];
    }
    var fX = ani.posX + ani.frameW * frame;
    this.element.css('background-position', '-' + fX + 'px -' + ani.posY + 'px');
  },
  
  toJSON: function(){
    return (this.parent() + ", animation: " + JSON.stringify(this.animation).replace(/"/g, "'"));
  }

});