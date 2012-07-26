/* State machine class for Gamecore library
 * © Algorithmica 2011
 **/

/*********************************************************************
 *                       Finite State Machine
 *********************************************************************/

Core.FSM = new Class({
  Extends: Core.Base,

  state: null,
  states: null,

  /* Adds a state to the state machine.
   *
   * Required params:
   * - name: state name
   *
   * Optional params:
   * - enter: callback called when entering the state
   * - leave: callback called when leaving the state
   *
   * The first added state is also the initial one. You can change initial
   * state using setInitial() method.
   *
   * Examples:
   *    var fsm = new Core.FSM;
   *    fsm.addState({name: 'state1', enter: enterCallback, leave: leaveCallback})
   *    fsm.addState({name: 'state2', enter: enterCallback})
   *    fsm.addState({name: 'state3'})
   *
   * Enter end leave callbacks will receive entering and leaving states as parameter.
   **/
  addState: function(stateDef){
    if(!this.states) this.states = new Hash;
    var enterFn = stateDef.enter ? stateDef.enter : function(){};
    var leaveFn = stateDef.leave ? stateDef.leave : function(){};
    this.states.set(stateDef.name, {
      enter: enterFn,
      leave: leaveFn,
      gonow: [],
      events: {}
    });
    if(this.state == null) this.state = stateDef.name;
    return this;
  },

  /* Adds a transition from one state to another.
   *
   * Required params:
   * - from: starting state for the transition. Event and condition will be checked in this state.
   * - to: destination state
   *
   * Optional params:
   * - event: event that triggers the transition.
   * - doing: callback for the transition
   * - allowed: callback that returns true or false OR boolean [true | false]. The transition is executed only if allowed is true.
   *
   * Why event is optional? Because if you do not specify an event, this transition will not wait for an
   * event but will trigger immediately, as soon as entering 'from' state. You can always specify a condition
   * to control the transition. Even if optional, in most cases you will specify the event.
   *
   * Examples:
   *
   *    var fsm = new Core.FSM;
   *    fsm.addTransition({
   *      from: 'state1',
   *      to: 'state2',
   *      event: 'go',
   *      doing: transitionCallback,
   *      allowed: conditionCallback
   *    });
   *    fsm.addTransition({
   *      from: 'state2',
   *      to: 'state1'
   *    });
   *
   *    fsm.event('go');
   *
   *    In this example as soon as we enter state2 we will return to state1.
   *    Fired callbacks (we use states defined in addState):
   *      state1 leaveCallback,
   *      state1 => state2 transitionCallback,
   *      state2 enterCallback,
   *      state1 enterCallback
   *
   * Note: both 'from' and 'to' states must be defined before adding a transition among them.
   * Doing and allowed callbacks will receive a parameter representing the transition.
   * Example for the transition from state1 to state2:
   *    "state1 => state2"
   **/
  addTransition: function(transition){
    if(!this.states) return this;
    var fromState = transition.from;
    var toState = transition.to;
    if(!(this.states[fromState] && this.states[toState])) return this;

    var state = this.states[fromState];
    var doingFn = transition.doing ? transition.doing : function(){};

    var allowedFn = null;
    if($defined(transition.allowed)){
      if($type(transition.allowed) == "boolean"){
        allowedFn = function(tr){return transition.allowed;}
      } else {
        allowedFn = transition.allowed;
      }
    } else {
      allowedFn = function(tr){return true;};
    }
    var newTransition = {
      to: toState,
      doing: doingFn,
      allowed: allowedFn
    };
    if(transition.event){
      state.events[transition.event] = newTransition;
    } else {
      /* Checks if the transition is already present in the gonow array
       * and, if so, replaces it with the new transition. */
      var replaced = state.gonow.some(function(transition, index){
        if(transition.to == toState){
          state.gonow[index] = newTransition;
          return true;
        }
        return false;
      });
      // If the transition was not found in the gonow array, adds it.
      if(!replaced) state.gonow.push(newTransition)
    }
    return this;
  },

  // Sets the initial state
  setInitial: function(state){
    this.state = state;
    return this;
  },

  /* Fires an event to the fsm. If the current state has a transition associated to that
   * event and if it is allowed, it wil cause the transition and a possible state change
   * (possible because a transition can loop on the same state).
   * Options are optional parameters that will be passed to the event handlers. */
  event: function(event, options){
    if(!this.states) return;
    var transition = this.states[this.state].events[event];
    if(transition && transition.allowed(this.state + " => " + transition.to)){
      this.doTransition(transition, options);
    }
  },

  /* After you initialized the fsm using addState() and addTransition(), start it calling
   * start. It is necessary only if your initial state has instant transitions (not bound to
   * events). */
  start: function(){
    this.triggerGonow();
  },

  /*=====================  Private methods please don't call ^_^ =====================*/

  doTransition: function(transition, options){
    // Leaves current state
    this.states[this.state].leave(this.state, options);
    // Executes transition callback
    transition.doing(this.state + " => " + transition.to, options);
    // Sets the new state
    this.state = transition.to;
    // Enters new state
    this.states[this.state].enter(this.state, options);
    // Checks if there are gonow transitions to trigger (not bound to events)
    this.triggerGonow();
  },

  triggerGonow: function(){
    var gonow = this.states[this.state].gonow;
    gonow.some(function(transition){
      if(transition.allowed(this.state + " => " + transition.to)){
        this.doTransition(transition);
        return true;
      }
      return false;
    }, this);
  }

});