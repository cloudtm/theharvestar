Game.Gui.Popup = new Class({
  Extends: Game.Gui.Item,
  name: "Popup",

  options: {
    template: 'none',
    timeout: 1000,    // ms to wait before fading in the popup
    fadeIn: 150      // fadeIn time in ms
  },

  /* Options:
   * - template: popup template
   * - target: actor target
   *
   **/
  init: function(options){
    // Marges manually some option
    if(options.timeout) this.options.timeout = options.timeout;
    if(options.fadeSpeed) this.options.fadeSpeed = options.fadeSpeed;

    this.element.hide();

    this.ie = document.all ? true : false;
    this.timer = null;    // timer used for timeout
    this.target = options.target.element || options.target;
    this.target.hover(this.hoverIn.bind(this), this.hoverOut.bind(this));
    this.startPos = {x: this.x, y: this.y};  // Saves the starting position

    this.machine = new Core.FSM;
    this.machine
      .addState({name: 'none', enter: this.enterState.bind(this)})
      .addState({name: 'intent', enter: this.enterState.bind(this)})
      .addState({name: 'active', enter: this.enterState.bind(this)})

      .addTransition({from: 'none', to: 'intent', event: 'hoverIn'})
      .addTransition({from: 'intent', to: 'active', event: 'timeout'})
      .addTransition({from: 'intent', to: 'none', event: 'hoverOut'})
      .addTransition({from: 'active', to: 'none', event: 'hoverOut'})
  },

  enterState: function(state){
    var instance = this;
    switch(state){

      case 'none':
        if(this.timer){
          clearInterval(this.timer);
          this.timer = null;
        }
        this.target.off('mousemove.popup');
        this.element.stop(true, true).hide();
        break;

      case 'intent':
        this.offset = $(this.target).offset();
        this.timer = setTimeout(this.timeout.bind(this), this.options.timeout);
        // We need to start tracking right now to update mouse position:
        this.target.on('mousemove.popup', this.track.bind(this));
        break;

      case 'active':
        this.timer = null;
        var delay = this.options.fadeIn;
        if(delay == 0){
          this.element.stop(true, true).show();
        } else {
          this.element.stop(true, true).fadeIn(delay);
        }
        break;
    }
  },

  track: function(event){
    this.updatePos(event);
  },

  hoverIn: function(event){
    if(!CONFIG.popups) return;
    this.machine.event('hoverIn');
    /* we have to update the position even at hover In because it's possible that
    * there would not be mousemove events for a while, if the user does not move
    * his mouse.
    * Note: the machine already changed state here and we have the target offset. */
    this.updatePos(event);
  },

  hoverOut: function(){
    this.machine.event('hoverOut');
  },

  timeout: function(){
    this.machine.event('timeout');
  },

  updatePos: function(event){
    var l = this.ie ? event.clientX + document.documentElement.scrollLeft : event.pageX;
    var u = this.ie ? event.clientY + document.documentElement.scrollTop : event.pageY;
    l -= this.offset.left;
    u -= this.offset.top;
    this.moveTo(this.startPos.x + l, this.startPos.y + u);
  }

});