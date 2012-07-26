Game.Gui.SystemMenu = new Class({
  Extends: Game.Gui.Item,
  name: "SystemMenu",

  options: {
    template: 'system-menu',
    // item params: name (gives also the name to the invoked function), icon, text (key for translation), [onstates, offstates]
    items: [
      {name: 'settings', icon: 'settings', text: 'gui.system_menu.settings'},
      {name: 'account', icon: 'account', text: 'gui.system_menu.account', onstates: ['list', 'hiscores']},
      {name: 'logout', icon: 'logout', text: 'gui.system_menu.logout'}
    ]
  },

  init: function(options){
    var self = this;
    this.menuItems = this.element.find('.menu-items');
    this.menuItems.hide();
    this.dlgSettings = null;

    var sysBtn = new Game.Gui.Button({
      anchor: {custom: 'btn-menu'}, template: 'none', text: "<div class='sprite sys-menu'></div>",
      call: function(){self.menuItems.stop(true, true).fadeIn(150);}
    });
    this.appendChild(sysBtn);

    this.btnMute = new Game.Gui.StateButton({
      anchor: {custom: 'mute'},
      template: 'none',
      text: "<div class='icon'></div>",
      states: [
        {name: 'on', call: function(){$send($msg.audio.mute, true); self.btnMute.event('toggle');}},
        {name: 'off', call: function(){$send($msg.audio.mute, false); self.btnMute.event('toggle');}}
      ],
      transitions: [
        {from: 'on', to: 'off', event: 'toggle'},
        {from: 'off', to: 'on', event: 'toggle'}
      ]
    });
    this.appendChild(this.btnMute);
    this.observe(SETTINGS);

    // Attaches mouseleave handlers to he system menu button
    this.element.on({
      'mouseleave.sysmenu': function(){self.menuItems.stop(true, true).fadeOut(150);}
    });

    // Generate menu items ***********************************/
    this.options.items.each(function(item){
      var it = $template('menu-item-template', {
        icon: item.icon,
        text: CONFIG.translation({key: item.text})
      });
      this.menuItems.append(it);
      item.element = it;
      it.on({
        'click.menuitem': function(event){
          event.preventDefault();
          if(!$(this).hasClass('disabled')){
            var handler = self[item.name];
            if(handler) handler.call(self);
            self.menuItems.hide();
          }
        }
      });
    }, this);

    this.mapListeners([
      {map: $msg.info.newState, to: adjustMenu}
    ]);

    // Private function
    function adjustMenu(state){
      this.options.items.each(function(item){
        if(item.onstates){
          item.onstates.contains(state) ? item.element.addClass('enabled').removeClass('disabled') : item.element.addClass('disabled').removeClass('enabled');
        } else if(item.offstates){
          item.offstates.contains(state) ? item.element.addClass('disabled').removeClass('enabled') : item.element.addClass('enabled').removeClass('disabled');
        }
      }, this);
    }
  },

  // Observer method. Called to know when the settings dialog closes.
  notify: function(obj, event){
    if(obj == this.dlgSettings){
      if(event == Core.Events.destroyed){
        GUI.modal(false);
        this.dlgSettings = null;
      }
    }
    if(obj == SETTINGS && SETTINGS.key(event.key).in('audio.volume')){
      this._adjustMute();
    }
  },

  /**********************************************************/
  // Menu Items handlers
  settings: function(){
    if(!this.dlgSettings){
      this.dlgSettings = new Game.Gui.SettingsDialog({
        subs: {
          title: CONFIG.translation({key: 'gui.settings.title'}),
          nameFx: CONFIG.translation({key: 'gui.settings.fx'}),
          nameMusic: CONFIG.translation({key: 'gui.settings.music'})
        }
      });
      GUI.modal(true);
      GUI.appendChild(this.dlgSettings);
      this.observe(this.dlgSettings);
      this._adjustMute(); // Settings activates again audio if it was muted, so we adjust the mute button stae here
    }
  },

  account: function(){
    $send($msg.rpc.account);

  },

  logout: function(){
    Game.Helpers.logout();
  },

  /*********************************************************/
  // Privates
  _adjustMute: function(){
    var volumes = SETTINGS.read('audio.volume');
    var audioOff = volumes.fx == 0 && volumes.music == 0;
    if((audioOff && this.btnMute.fsm.state == 'on') || (!audioOff && this.btnMute.fsm.state == 'off')){
      this.btnMute.event('toggle');
    }
  }

});