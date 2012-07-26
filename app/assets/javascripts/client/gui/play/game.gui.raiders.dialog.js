
/****************************************************************/
/*                      RAIDERS TRADE                           */
/****************************************************************/
Game.Gui.RaidersDialog = new Class({
  Extends: Game.Gui.Dialog,
  name: "RaidersDialog",

  options: {
    template: 'raiders-dialog'
  },

  init: function(options){
    this.parent(options);
    
    this.selection = {
      r: null,    // receive  from raiders
      g: null     // give to raiders
    };
    this.receiveCircle = null;
    this.giveCircle = null;
    this.usableResources = CONFIG.resourceSet().getKeys();
    this.give = this.element.find('.give'); // Used when updating resources
    this.factor = Math.abs(CONFIG.gameOptions.bank_rate);

    this.element.find('.tip .factor').html('X' + this.factor);
    
    /* Buttons ************************************************/
    this.tradeBtn = new Game.Gui.Button({
      anchor: {custom: 'trade'},
      call: this.trade.bind(this),
      template: 'none',
      enabled: false,
      text: false
    });
    this.tradeCloseBtn = new Game.Gui.Button({
      anchor: {custom: 'trade-close'},
      call: this.tradeClose.bind(this),
      template: 'none',
      enabled: false,
      text: false
    });
    this.closeBtn = new Game.Gui.Button({
      anchor: {custom: 'close'},
      call: this.close.bind(this),
      template: 'none',
      text: false
    });
    this.appendChild(this.tradeBtn);
    this.appendChild(this.tradeCloseBtn);
    this.appendChild(this.closeBtn);
    
    /* Some behavior *******************************************/
    var me = this;
    this.element.find('.resource')
    .hover( this.hoverIn, this.hoverOut )
    .mousedown( function(event){if(!$(this).parent().is('.disabled')) $send($msg.audio.fx, $fx.gui.buttonClick);} )
    .click( function(event){me.chose(this, me, event);} );
    
    this.updateResources();
    
    this.mapListeners([
      {map: $msg.info.resources, to: this.updateResources}
    ]);
    $log("Game.Gui.RaidersDialog: added.");
  },
  
  /****************************************************************/
  // Buttons actions
  trade: function(){
    // If both are defined, makes the request
    if(!(this.selection.r && this.selection.g)) return;
    this.send($msg.rpc.doFixedTrade, this.selection);
  },
  tradeClose: function(){
    this.trade();
    this.close();
  },

  /****************************************************************/
  /* Updates the resources in the give selectors. Uses GAME.resources
   * because this function is called not only by the message but also
   * manually in the init. */
  updateResources: function(){
    this.usableResources.each(function(res){
      var circle = this.give.find('.' + res);
      var resource = circle.find(' .resource');
      var val = GAME.resources[res];
      resource.find('span').html(val);
      if(val < this.factor){
        circle.addClass('disabled');
        if(circle.is('.selected')){
          circle.removeClass('selected');
          this.selection.g = null;
          this.updateButtons();
        }
      } else {
        circle.removeClass('disabled');
      }
    }, this);
    return true;
  },
  
  /****************************************************************/
  // Resource selection functions
  chose: function(target, me, event){
    var selector = $(target);
    var circle = selector.parent();
    if(circle.is('.disabled')) return;

    var panel = circle.parent();
    var res = selector.attr('rel');
    switch(panel.attr('class')){
      case 'receive':
        if(me.receiveCircle){
          if(me.selection.r == res) return; //alredy selected
          me.receiveCircle.removeClass('selected');
        } else {
          // Unhides the counteroffer panel
          me.give.show();
        }
        // Do new receive selection:
        circle.addClass('selected');
        panel.append(circle);   // Reappend at the end applies an inplicit z-index so this circle appears over the other ones.
        me.receiveCircle = circle;
        me.selection.r = res;
        break;
      case 'give':
        if(me.giveCircle){
          if(me.selection.g == res) return; //alredy selected
          me.giveCircle.removeClass('selected');
        }
        // Do new give selection:
        circle.addClass('selected');
        panel.append(circle);   // Reappend at the end applies an inplicit z-index so this circle appears over the other ones.
        me.giveCircle = circle;
        me.selection.g = res;
        break;
    }
    me.updateButtons();
  },
  
  updateButtons: function(){
    var enabled = (this.selection.g && this.selection.r) ? true : false;
    this.tradeCloseBtn.enable(enabled);
    this.tradeBtn.enable(enabled);
  },
  
  hoverIn: function(event){
    var circle = $(this).parent();
    if(circle.is('.selected, .disabled')) return;
    circle.addClass('highlight');
  },
  
  hoverOut: function(event){
    var circle = $(this).parent();
    circle.removeClass('highlight');
  }
});