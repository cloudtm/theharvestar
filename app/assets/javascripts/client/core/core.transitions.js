/* Gamecore mini js library for js game programming
 * Based on moo4q (mootools for jQuery)
 * © Algorithmica 2011
 */

/* Nice easing function generator: http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm
 * parameters explanation: t is time, b is duration, c is scale, d is offset.
 * Typically c = 1 and d = 0.
 */

Core.Transition = Core.Transition || {}
/*********************************************************************
 *                          Easing functions
 *********************************************************************/

/**********************************************************************/
// Base class for all transitions.
// It defines the 3 standard easing parameters.
Core.Transition.Base = new Class({
  Extends: Core.Base,
  Implements: Options,

  options:{
    scale: 1,     // easing result is multiplied by scale (es: [0..1] with 2 scale becomes [0..2])
    duration: 1,  // swing duration in time or anything else. Leave it at 1 if using a normalized swing (0..1).
    offset: 0,    // added to the easing result to move the start and end out values (es: [0..1] with 0.5 offset becomes [0.5..1.5])
    repeat: false // true if you want to repeat continuously the transition (see adjust function)
  },

  initialize: function(options){
    this.parent();
    this.setOptions(options);
  },

  /* Called by the controller to adjust the swing parameter. Default value depends on repeat:
   * 
   * - false: limits the swing between 0 and duration.
   * - true:  repeats the transition continuously. If the transition is not continue between 0 and
   *          duration you will obtain a discontinuous effect. Use it with continuous transitions
   *          like oscillators (full or half period sin/cos etc...)
   *
   * You can also override it to make any other custom adjustment.
   * */
  adjust: function(swing){
    var adjustedSwing = this.options.repeat ? (swing % this.options.duration) : (Math.min(this.options.duration, Math.max(0, swing)))
    return adjustedSwing;
  }
});

/**********************************************************************/
/* Generic swing function. It allows to pass a generci swing function.
 * Example:
 *
 *  var tr = new Core.Transitions;
 *  tr.add('custom', {fn: function(x){
 *    return( (1-x)*x + x*Math.sin(x*Math.Pi/2) );
 *  }});
 *
 *  You can also receive all the transition parameters: offse, scale and duration
 *  to work with. See the swing function below.
 * */
Core.Transition.Custom = new Class({
  Extends: Core.Transition.Base,

  options:{
    fn: function(){
      throw "Core.Transition.Custom: no function specified!";
      }
  },

  swing: function(swing){
    return this.options.fn(swing, this.options.offset, this.options.scale, this.options.duration);
  }

});

/**********************************************************************/
// Simple linear swing mapper.
Core.Transition.Linear = new Class({
  Extends: Core.Transition.Base,

  swing: function(swing){
    return ((this.options.scale * swing / this.options.duration) + this.options.offset);
  }

});

/**********************************************************************/
// Wrapper for jQuery easing functions
Core.Transition.Wrapper = new Class({
  Extends: Core.Transition.Base,

  options:{
    fn: null
  },

  swing: function(swing){
    /* param 1: normalized swing (0..1). Note: at the moment this is not used in easing functions.
     * param 2: swing (0..duration)
     * param 3: value added to the outpu, typically 0
     * param 4: scale of the output, typically 1
     * param 5: transition duration. Typically we use 1, like the normalized swing.
     *          But any other value > 0 is allowed. Duration is not bound to time, like
     *          in jQuery animate, can be any value that defines a 0..duration range. Out will
     *          range from 0 to 1 for swing going from 0 to duration.
     * */
    var d = this.options.duration;
    var normSwing = (d == 1 ? swing : swing / d);
    return this.options.fn(normSwing, swing, this.options.offset, this.options.scale, this.options.duration);
  }

});

/*********************************************************************
 *               Easing functions builder/controller
 *********************************************************************/

// Builds an array of swing mappings. (Builder/Factory pattern)
Core.Transitions = new Class({
  Extends: Core.Base,

  initialize: function(){
    this.parent();
    this.transitions = {}; //added transitions: {}
    this.out = {};  // output swings
  },

  /* Adds a transition function. If tr is a Core.Transitions instance, you can use it like:
   *
   *    tr.add('trans1').add('trans2',{ease: 'Custom', ...options...}).add( ... ;
   *
   * First added transition 'trans1' is by default Linear. You can use ease option to specify a different easing.
   * See Core.Transition.Base for the options meaning. After you built the transition
   * controller, use it simply calling:
   *
   *    tr.swing(float);
   *
   * It maps surjectively the swing (0..duration) in a hash of swings {trans1: (0..1), trans2: (0..1),..},
   * one entry for every transition function you added. You can add also all the jQuery
   * UI easing functions, without the "ease" prefix ("easeInOutSine" becomes "InOutSine").
   */
  add: function(name, options){
    options = options || {};
    options.ease = options.ease || "Linear";
    try{
      // find a Core transition
      var transition = Core.Transition[options.ease];
      // if not found tries to map to a jQuery transition
      if(!transition){
        options.fn = jQuery.easing["ease" + options.ease];
        if(options.fn) transition = Core.Transition.Wrapper;
      }
      if(this.transitions[name]){
        $log("Core.Transitions: already assigned transition: " + name, {level: "error"});
      } else {
        this.transitions[name] = new transition(options);
      }
    }catch(err){
      $log("Core.Transitions: unknown ease function: " + options.ease, {level: "error"});
    }
    return this;
  },

  // Maps input swing into an array of output swings
  swing: function(swing){
    for(var name in this.transitions){
      if(!this.transitions.hasOwnProperty(name)) continue;
      var transition = this.transitions[name];
      var adjusted = transition.adjust(swing);
      this.out[name] = transition.swing(adjusted);

    }
    return this.out;
  }
});
