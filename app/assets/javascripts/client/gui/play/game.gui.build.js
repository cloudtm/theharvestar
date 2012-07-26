Game.Gui.BuildButtons = new Class({
  Extends: Game.Gui.Item,
  name: "BuildButtons",

  options: {
    template: 'build-buttons',
    buildCursor: 'build-cursor',
    buildActive: "active",
    button: {
      station: {x:0, y:0},
      outpost: {x:0, y:68},
      link: {x:0, y:115}
    } // Buttons positions
  },

  init: function(options){
    // Creates the build buttons
    var pos = this.options.button;
    this.station = new Game.Gui.Button({
      x: pos.station.x, y: pos.station.y,
      call: {click: this.buildStation.bind(this), mousedown: this.stopBuild.bind(this)},
      events: ['click', 'mousedown'],
      template: 'build-button',
      klass: 'station',
      text: false
    });
    this.outpost = new Game.Gui.Button({
      x: pos.outpost.x, y: pos.outpost.y,
      call: {click: this.buildOutpost.bind(this), mousedown: this.stopBuild.bind(this)},
      events: ['click', 'mousedown'],
      template: 'build-button',
      klass: 'outpost',
      text: false
    });
    this.link = new Game.Gui.Button({
      x: pos.link.x, y: pos.link.y,
      call: {click: this.buildLink.bind(this), mousedown: this.stopBuild.bind(this)},
      events: ['click', 'mousedown'],
      template: 'build-button',
      klass: 'link',
      text: false
    });
    this.appendChild(this.station);
    this.appendChild(this.outpost);
    this.appendChild(this.link);

    // Defines structures costs
    this.cost = {
      station: $H(CONFIG.gameOptions.city_cost).map(function(val){return Math.abs(val);}),
      outpost: $H(CONFIG.gameOptions.colony_cost).map(function(val){return Math.abs(val);}),
      link: $H(CONFIG.gameOptions.road_cost).map(function(val){return Math.abs(val);})
    };

    this.addPopup(this.station, this.cost.station);
    this.addPopup(this.outpost, this.cost.outpost);
    this.addPopup(this.link, this.cost.link);

    // current bonuses
    this.bonus = {links: 0, outposts: 0};

    // Listens for resources updates to enable/disable buttons
    this.mapListeners([
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop},
      {map: $msg.info.resources, to: this.updateButtons},
      {map: $msg.info.labStore, to: this.updateBonuses}
    ]);
  },

  start: function(){
    this.updateButtons();
    this.updateBonuses();
  },
  
  stop: function(){
    this.bonus.links = this.bonus.outposts = 0;
    this.station.enable(false);
    this.outpost.enable(false);
    this.link.enable(false);
    this.link.element.find('.bonus').hide();
    this.outpost.element.find('.bonus').hide();
  },

  /********************************************************************************/
  // Build button actions
  buildStation: function(){
    this.startBuild({
      start: $msg.event.upgradeBaseStart,
      stop: $msg.event.upgradeBaseStop,
      button: this.station
    });
  },
  
  buildOutpost: function(){
    this.startBuild({
      start: $msg.event.buildBaseStart,
      stop: $msg.event.buildBaseStop,
      button: this.outpost
    });
  },
  
  buildLink: function(){
    this.startBuild({
      start: $msg.event.buildLinkStart,
      stop: $msg.event.buildLinkStop,
      button: this.link
    });
  },
  
  /********************************************************************************/
  // Adds popups
  addPopup: function(target, resources){
    var popup = new Game.Gui.Popup({
      x: target.x + 10, y: target.y - 40,
      template: "build-popup",
      subs: resources.getClean(),
      timeout: 500,
      target: target
    });

    // Removes all zero occurrences
    var total = 5;
    resources.each(function(count, res){
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
  // Manages the build event: activates/deactivates build cursor and map structures hovering.
  startBuild: function(params){
    this.buildParams = params;
    WORLD.element.on('click.gui.build', this.stopBuild.bind(this)); // binds a world click event
    WORLD.element.addClass(this.options.buildCursor);
    params.button.element.addClass(this.options.buildActive); // Button remain in active highlighted state
    $send(this.buildParams.start);
  },

  stopBuild: function(event){
    if(this.buildParams){
      WORLD.element.off('click.gui.build');
      WORLD.element.removeClass(this.options.buildCursor);
      this.buildParams.button.element.removeClass(this.options.buildActive);  // Removes the active highlighted state
      $send(this.buildParams.stop);
      delete this.buildParams;
    }
  },
  
  /********************************************************************************/
  // Monitor bonus links
  updateBonuses: function(){
    var self = this;
    // Update outposts
    var bonus = this.outpost.element.find('.bonus');
    var count = GAME.bonuses.outposts;
    update('outposts');

    // Update links
    bonus = this.link.element.find('.bonus');
    count = GAME.bonuses.links + GAME.labStore.transport;
    update('links');

    return true;

    function update(type){
      if(count > 0){
        bonus.html(count);
        if(GAME.loading){
          bonus.show();
        } else if(self.bonus[type] != count){  // Avoids blinking on every research
            bonus.fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
        }
        self.bonus[type] = count;
      } else {
        bonus.hide();
      }
    };
  },
  
  /********************************************************************************/
  // Enables / disables buttons, based on resource availability and initial placement
  updateButtons: function(){
    this.station.enable(isAffordable(this.cost.station) && GAME.me.map.outposts > 0);
    this.outpost.enable(isAffordable(this.cost.outpost) || bonusOutposts());
    this.link.enable(isAffordable(this.cost.link) || bonusLinks());
    return true;

    function isAffordable(price){
      return price.every(function(needed, res){
        return (GAME.resources[res] >= needed);
      })
    };
    function bonusLinks(){
      var owned = GAME.me.map;
      // deactivates the bonus if there is no building where to attach the link
      //var anyBonus = (GAME.bonuses.links + GAME.labStore.transport > 0) && ((owned.outposts + owned.stations) > 0);
      var anyBonus = (GAME.bonuses.links + GAME.labStore.transport> 0) && ((owned.outposts + owned.stations) > 0);
      return anyBonus;
    };
    function bonusOutposts(){
      var anyBonus = (GAME.bonuses.outposts > 0);
      return anyBonus;
    };
  }

});