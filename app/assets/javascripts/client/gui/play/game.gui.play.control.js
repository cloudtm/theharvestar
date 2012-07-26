/***************************************************************************
               Game Control Panel (sounds mixer, quitting...)
***************************************************************************/

// By now it just wraps the give up buttone. Make different classes when it evolves.
Game.Gui.PlayControlPanel = new Class({
  Extends: Game.Gui.Item,
  name: "PlayControlPanel",

  options:{
    template: 'none',
    giveUpPulse: 300,  // pusling period
    pulses: [1, 0.5]    // opacity pulses
  },
  
  init: function(options){
    var self = this;
    this.btnGiveUp = new Game.Gui.Button({
      anchor: {custom: 'giveup'},
      template: 'none',
      text: false,
      call: this.giveUp.bind(this)
    });
    this.btnGiveUp.element.hover(pulseOn, pulseOff);
    this.appendChild(this.btnGiveUp);

    $log("Game.Gui.ControlPanel: added.");

    // Privates
    function pulseOn(){
      self.btnGiveUp.element.stop(true).pulse(
        {opacity: self.options.pulses},
        {duration: self.options.giveUpPulse, easing: "easeOutSine", times: 1000}
      );
    }
    function pulseOff(){
      self.btnGiveUp.element.stop().css('opacity', self.options.pulses[0]);
    }
  },

  giveUp: function(){
    $send($msg.rpc.giveupGame);
  }
  
});
