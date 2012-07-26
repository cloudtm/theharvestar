/* Resources gui item */
Game.Gui.Resources = new Class({
  Extends: Game.Gui.Item,
  name: "Resources",

  options: {
    template: 'resources',
    zeroClass: 'zero',    // class assigned to the button counter when the resource is 0
    pulseSpeed: 700,
    pulses: [0.5, 0]
  },

  init: function(options){
    this.resources = {};
    var buttonSpacing = 2;
    // Order matters
    this.addButton(CONFIG.resources.cyclon, 0, (47 + buttonSpacing) * 0);
    this.addButton(CONFIG.resources.mountain, 0, (47 + buttonSpacing) * 1);
    this.addButton(CONFIG.resources.lake, 0, (47 + buttonSpacing) * 2);
    this.addButton(CONFIG.resources.field, 0, (47 + buttonSpacing) * 3);
    this.addButton(CONFIG.resources.volcano, 0, (47 + buttonSpacing) * 4);
    this.addButton(CONFIG.resources.recycle, 0, (47 + buttonSpacing) * 5);

    // Removes warning div from the recycle matter button
    this.resources[CONFIG.resources.recycle].element.find('.raider-warning').remove();
    this.warning = this.element.find('.raider-warning');
    
    // Dialogs
    this.dialogs = {market: null, recycle: null};

    this.mapListeners([
      {map: $msg.info.resources, to: this.showResources},
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.gameEnded, to: this.ended},
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Game.Gui.Resources: added.");
  },

  start: function(){
    this.showResources(GAME.resources);
  },

  ended: function(){
    // Closes dialogs
    if(this.dialogs.recycle) this.dialogs.recycle.close();
    if(this.dialogs.market)this.dialogs.market.close();
    this.dialogs.recycle = null;
    this.dialogs.market = null;
  },

  stop: function(){
    // Empties resources to disable pulse
    var zero = CONFIG.resourceSet();
    zero.set(CONFIG.labStoreEntries.recycle, 0);
    this.showResources(zero);

    // Closes dialogs
    if(this.dialogs.recycle) this.dialogs.recycle.close();
    if(this.dialogs.market) this.dialogs.market.close();
    this.dialogs.recycle = null;
    this.dialogs.market = null;
  },
  
  addButton: function(res, posX, posY){
    var button = new Game.Gui.Button({
      x: posX, y: posY,
      call: this.exchange.bind(this),
      template: 'resources-button',
      klass: res,
      text: false,
      store: res
    });
    this.resources[res] = button;
    this.appendChild(button);

    // Resource name popup
    this.appendChild(new Game.Gui.Popup({
      x: button.x + 10, y: button.y - 40,
      template: "resource-popup",
      subs: {resource: res == 'grain' ? 'FOOD' : res.toUpperCase()},
      target: button
    }));
  },
  
  exchange: function(event, res){
    if(res == CONFIG.resources.recycle){
      if(this.dialogs.recycle) return;
      this.dialogs.recycle = new Game.Gui.RecycleDialog({center: MAP.element});
      this.observe(this.dialogs.recycle);
      GUI.appendChild(this.dialogs.recycle);

    } else {
      if(this.dialogs.market) return;
      this.dialogs.market = new Game.Gui.MarketDialog({center: MAP.element, resource: res});
      this.observe(this.dialogs.market);
      GUI.appendChild(this.dialogs.market);
    }
  },
  
  // Notifies dialog destruction
  notify: function(obj, event){
    if(event == Core.Events.destroyed){
      if(obj == this.dialogs.recycle) this.dialogs.recycle = null;
      if(obj == this.dialogs.market) this.dialogs.market = null;
    }
  },

  showResources: function(resources){
    var sum = 0;
    resources.each(function(val, res){
      var button = this.resources[res];
      var counter = $(".res-count", button.element);
      counter.html(val);
      val == 0 ? counter.addClass(this.options.zeroClass) : counter.removeClass(this.options.zeroClass);
      if(res == CONFIG.resources.recycle){
        button.enable(val > 0);
      } else {
        sum += val;
      }
    }, this);
    this.alert(sum > CONFIG.gameOptions.uneffected_resource);
    return true;
  },

  // Raiders alert
  alert: function(enable){
    if(enable){
      if(!this.pulsing){ $send($msg.info.popup, {key: 'action.tips.raider_alert', type: 'alert'}); }
      this.pulsing = true;
      this.warning.stop(true).pulse(
        {opacity: this.options.pulses},
        {duration: this.options.pulseSpeed, easing: "linear", times: 1000}
      );
    } else {
      this.pulsing = false;
      this.warning.stop(true).css({opacity: this.options.pulses[1]})
    }
  }

});
