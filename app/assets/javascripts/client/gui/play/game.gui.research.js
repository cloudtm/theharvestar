Game.Gui.ResearchButtons = new Class({
  Extends: Game.Gui.Item,
  name: "ResearchButtons",

  options: {
    template: 'research-buttons',
    researchActive: "active",
    button: { // Buttons positions
      boycot: {x:0, y:0},
      research: {x:0, y:40}
    } 
  },

  init: function(options){
    // Creates the build buttons
    var pos = this.options.button;
    this.boycot = new Game.Gui.Button({
      x: pos.boycot.x, y: pos.boycot.y,
      call: this.useBoycot.bind(this),
      template: 'research-button',
      klass: 'boycot',
      text: false
    });
    this.boycot.counter = this.boycot.element.find('.count');
    this.research = new Game.Gui.Button({
      x: pos.research.x, y: pos.research.y,
      call: this.doResearch.bind(this),
      template: 'research-button',
      klass: 'research',
      text: false
    });
    this.appendChild(this.boycot);
    this.appendChild(this.research);
    
    // Defines research cost
    this.researchCost = $H(CONFIG.gameOptions.development_cost).map(function(val){return Math.abs(val);});

    this.addPopups();
    
    this.boycotCount = 0;
    this.dialog = null;
    this.lab = null;

    // Listens for resources updates to enable/disable buttons
    this.mapListeners([
      {map: $msg.info.resources, to: this.updateResearch},
      {map: $msg.info.labStore, to: this.updateLab},
      {map: $msg.info.redHistory, to: this.updateRed},
      // Ajax complete events
      {map: $msg.error.fundResearch, to: this.researchError},
      {map: $msg.error.boycot, to: this.boycotError},

      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.gameEnded, to: this.ended},
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Game.Gui.ResearchButtons: added.");
  },

  start: function(){
    this.lab = new Hash(GAME.labStore);
    this.lab.set('cultural', 0);  // Adds the cultural level from red History. Somewhat hardcoded here...

    this.updateResearch();
    this.updateLab(GAME.labStore);
    this.updateRed(GAME.redHistory);
  },

  ended: function(){
    if(this.dialog) this.dialog.close();
    this.dialog = null;
  },

  stop: function(){
    if(this.dialog) this.dialog.close();
    this.dialog = null;
    this.lab = null;
    this.boycot.counter.hide();
    this.boycot.enable(false);
    this.research.enable(false);
  },

  /********************************************************************************/
  // Adds popups
  addPopups: function(){
    // Boycot popup
    this.appendChild(new Game.Gui.Popup({
      x: this.boycot.x + 10, y: this.boycot.y - 40,
      template: "boycot-popup",
      timeout: 500,
      target: this.boycot
    }));

    // Research popup
    var popup = new Game.Gui.Popup({
      x: this.research.x + 10, y: this.research.y - 40,
      template: "research-popup",
      subs: this.researchCost.getClean(),
      timeout: 500,
      target: this.research
    });

    // Removes all zero occurrences
    var total = 5;
    this.researchCost.each(function(count, res){
      if(count == 0){
        popup.element.find('.resource.' + res).remove();
        total--;
      }
    });
    // 38 = 32[circle width] + 3[margin] * 2
    popup.element.width(total * 38);
    this.appendChild(popup);
  },

  /********************************************************************************/
  // Messages listeners

  /* We update the labStore changes so that we can tell
   * the player what he/she obtained from r&d.
   * Also updates boycot button state. */
  updateLab: function(lab){
    $H(lab).each(function(progressCount, progressType){
      /* Shows a dialog for every obtained lab store item.
       * Note: a page reload triggers a dialog for every lab store item as we
       * compare it to the currentLabStore that is empty. */
      if(progressCount > this.lab[progressType]){
        if(!GAME.loading){
          if(this.dialog) this.dialog.close();
          this.dialog = new Game.Gui.RDInfoDialog({
            center: MAP.element,
            type: progressType,
            count: progressCount - this.lab[progressType]
          });
          this.observe(this.dialog);
          GUI.appendChild(this.dialog);
        }
      }
      this.lab.set(progressType, progressCount);
    }, this);
    if($defined(lab.social)) this.updateBoycot(); // skip the update from updateRed
    return true;
  },

  // Uses the same updateLab to manage cultural updates
  updateRed: function(reds){
    this.updateLab({cultural: reds.cultural_level});
    return true;
  },
  
  // Re-enables buttons when ajax call failed because no resource was used.
  boycotError: function(){this.boycot.enable(true);},
  researchError: function(){this.research.enable(true);},
  
  // Notifies dialog destruction
  notify: function(obj, event){
    if(event == Core.Events.destroyed) this.dialog = null;
  },

  /********************************************************************************/
  // Build button actions
  useBoycot: function(){
    this.boycot.enable(false);
    $send($msg.rpc.chaseAwayCriminality);
  },
  
  doResearch: function(){
    this.research.enable(false);
    $send($msg.rpc.fundResearch);
  },
  
  /********************************************************************************/
  // Enables / disables research, based on resource availability
  updateResearch: function(){
    this.research.enable(this.isAffordable(this.researchCost));
    return true;
  },
  
  isAffordable: function(price){
    return price.every(function(needed, res){
      return (GAME.resources[res] >= needed);
    })
  },

  // Updates (show/blink/hide) the boycot count
  updateBoycot: function(){
    var counter = this.boycot.counter;
    if(this.lab.social > 0){
      this.boycot.enable(true);
      counter.html(this.lab.social);
      if(GAME.loading){
        counter.show();
      } else if(this.boycotCount != this.lab.social){  // Avoids blinking on every research
        counter.fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
      }
    } else {
      counter.hide();
      this.boycot.enable(false);
    }
    this.boycotCount = this.lab.social;
  }

});

////////////////////////////////////////////////////////////////////////////////
//                                  DIALOGs
////////////////////////////////////////////////////////////////////////////////
/* R&D Buy Notification: shows an info dialog with what you obtained from R&D */
 Game.Gui.RDInfoDialog = new Class({
   Extends: Game.Gui.Dialog,
   name: "RDInfoDialog",

   options: {
     template: 'research-dialog'
   },

  init: function(options){
    this.parent(options);
    this.appendChild(new Game.Gui.Button({
      anchor: {custom: 'ok'},
      call: this.close.bind(this),
      template: 'none',
      enabled: true,
      text: false
    }));

    var content = this.element.find('.' + options.type);
    // Shows the proper research message
    content.find('.count').html(options.count);
    content.css('display','block');
    // Shows the proper research type icon
    this.element.find('.type span').addClass(options.type);
  }
 });
 
 /* Recycle exchange dialog */
 Game.Gui.RecycleDialog = new Class({
   Extends: Game.Gui.Dialog,
   name: "RecycleDialog",

   options: {
     template: 'recycle-dialog'
   },

  init: function(options){
    this.parent(options);
    
    this.selector = new Game.Gui.ResourceSelector({ x: 54, y: 236, min: 0 });
    this.appendChild(this.selector);
    this.observe(this.selector);
    
    /* Buttons ************************************************/
    this.btnOk = new Game.Gui.Button({
      anchor: {custom: 'ok'},
      call: this.recycle.bind(this),
      template: 'none',
      enabled: false,
      text: false
    });
    this.appendChild(this.btnOk);
    this.appendChild(new Game.Gui.Button({
      anchor: {custom: 'cancel'},
      call: this.close.bind(this),
      template: 'none',
      enabled: true,
      text: false
    }));
    this.appendChild(new Game.Gui.Button({
      anchor: {custom: 'reset'},
      call: this.reset.bind(this),
      template: 'none',
      enabled: true,
      text: "Reset selection"
    }));
    
    this.recycled = {
      count: 0,
      used: 0,
      counter: this.element.find('.recycled span')
    }
    this.update(GAME.resources);
    
    // Listens for resource updates (note: it contains also recycled matter)
    this.mapListeners([
      {map: $msg.info.resources, to: this.update}
    ]);
  },
  
  update: function(res){
    this.recycled.count = res.recycle;
    this.selector.setMaxSum(this.recycled.count);
    this.recycled.used = this.selector.sum(); // Recalculates the sum as max sum re-constrain the selection.
    this.render();
  },
  
  /* Notifications from selector:
   * up => {type: 'up', resource: res, count: num, sum: num, balanced: bool}
   * down => {type: 'down', resource: res, count: num, sum: num, balanced: bool}
   * tap => {type: 'tap'} [NOT INTERESTING]
   **/
  notify: function(obj, event){
    if(obj != this.selector || event.type == "tap") return;
    this.recycled.used = event.sum;
    this.btnOk.enable(event.sum > 0);
    this.render();
  },
  
  render: function(){
    this.recycled.counter.html(this.recycled.count - this.recycled.used);
  },
  
  recycle: function(){
    var give = "magic_resource";
    var receive = this.selector.selection.getClean();
    this.send($msg.rpc.doFixedTrade, {r: receive, g: give});
    $send($msg.audio.fx, $fx.gui.recycle);
    this.close();
  },
  
  reset: function(){
    this.selector.revert();
    this.recycled.used = this.selector.sum();
    this.btnOk.enable(this.recycled.used > 0);
    this.render();
  }
  
 });