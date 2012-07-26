/********************************************************************************/
/* Players display gui item. */
Game.Gui.Players = new Class({
  Extends: Game.Gui.Item,
  name: "Players",

  options: {
    template: 'players',
    otherPlayerWidth: 125,
    playerMargin: 10
  },

  init: function(options){
    this.players = new Hash;
    this.transportAward = null;
    this.socialAward = null;

    /****************************************************************/
    // Listener
    this.mapListeners([
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop},
      {map: $msg.info.challanges, to: this.showChallenges},
      {map: $msg.info.redHistory, to: this.showCultural}
    ]);
    $log("Game.Gui.Players: added.");
  },

  start: function(){
    this.setupPlayers();
    this.showChallenges(GAME.challanges);
    this.showCultural(GAME.redHistory);
  },

  stop: function(){
    // Removes awards
    this.transportAward.destroy();
    this.socialAward.destroy();
    this.culturalAward.destroy();
    this.transportAward = null;
    this.socialAward = null;
    this.culturalAward = null;

    // Removes players
    this.players.each(function(player){
      if(player.info){ player.info.empty().remove(); }
      player.destroy();
    });
    this.players.empty();
  },

  showChallenges: function(challenges){
    if(challenges.transport.leader && challenges.transport.leader != this.transportAward.owner){
      this.transportAward.owner = challenges.transport.leader
      this.transportAward.showOn(this.players[challenges.transport.leader].element);
    }
    if(challenges.social.leader && challenges.social.leader != this.socialAward.owner){
      this.socialAward.owner = challenges.social.leader;
      this.socialAward.showOn(this.players[challenges.social.leader].element);
    }
    return true;
  },

  showCultural: function(reds){
    if(reds.cultural_level > 0){
      if(this.culturalAward.count == 0){ this.culturalAward.showOn(this.players[GAME.me.slot].element); }
      this.culturalAward.setCount(reds.cultural_level, true);
    }
  },

  setupPlayers: function(){
    /****************************************************************/
    /* First creates my avatar */
    var me = GAME.players[GAME.pid];
    var player = new Game.Gui.Item({
      // positioned at default 0,0
      template: "player",
      subs: {
        playerId: me.slot,
        avatar: me.avatar,
        userName: me.name,
        playerScore: "Level " + me.power.level
      }
    });
    player.element.addClass('my');
    this.players[me.slot] = player;
    this.appendChild(player);
    player.forwarder = new Core.MouseEventsForwarder(player.element);

    /****************************************************************/
    /* Then creates other player avatars, if any. */
    // Variables for other players centering:
    var numOtherPlayers = GAME.pids.length - 1;

    // Left => right order where left is up
    //var startX = ((numOtherPlayers - 2) * this.options.otherPlayerWidth + (numOtherPlayers - 1) * this.options.playerMargin) >> 1;
    //var deltaX = - (this.options.otherPlayerWidth + this.options.playerMargin);

    // Right => left order where right is up
    var startX = -(numOtherPlayers * this.options.otherPlayerWidth + (numOtherPlayers - 1) * this.options.playerMargin) >> 1;
    var deltaX = this.options.otherPlayerWidth + this.options.playerMargin;

    var otherBox = this.element.find('.others');
    var infos = [];
    var leftMost = null;  // reference to the left most player

    GAME.players.each(function(pinfo){
      if(pinfo.slot == me.slot) return; // continue

      // substitutions for the template
      player = new Game.Gui.Item({
        x: startX, y: 0,
        template: "player",
        subs: {
          playerId: pinfo.slot,
          avatar: pinfo.avatar,
          userName: pinfo.name,
          playerScore: "Level " + pinfo.power.level
        }
      });
      if(!leftMost){ leftMost = player; }
      player.element.addClass('other');
      this.players[pinfo.slot] = player;
      this.appendChild(player, ".others");  // .others div is positioned under the map (css controls its positioning)

      player.info = player.element.find('.info');
      player.info.css('left', startX + 29);
      infos.push(player.info); // saves info boxes because they need to pe appended later.

      startX += deltaX;
    }, this);
    // attaches forwarder to the left most avatar as it covers partially the map if more than 2 players
    if(GAME.players.getLength() > 2){
      player.forwarder = new Core.MouseEventsForwarder(leftMost.element);
    }

    // Moves the info boxes outside of the player div for visualization order purposes.
    infos.each(function(info){ info.appendTo(otherBox); });

    /****************************************************************/
    // Awards are hidden. They have a showOn method that appends it to the right player showing it
    this.transportAward = new Game.Gui.Award({anchor: {custom: 'transport award'}});
    this.transportAward.owner = -1;
    this.socialAward = new Game.Gui.Award({anchor: {custom: 'social award'}});
    this.socialAward.owner = -1;
    this.culturalAward = new Game.Gui.Award({anchor: {custom: 'cultural award'}});
    this.appendChild(this.transportAward);
    this.appendChild(this.socialAward);
    this.appendChild(this.culturalAward);
  }

});

/********************************************************************************/
// AWARDS

Game.Gui.Award = new Class({
  Extends: Game.Gui.Item,

  init: function(options){
    this.count = 0;
  },

  showOn: function(container){
    this.element.appendTo(container);
    this.element.show();
    this.blink();
  },

  // blink: [true | false] blink on count change
  setCount: function(count, blink){
    if(count != this.count){
      this.count = count;
      if(!this.counter){
        this.counter = $('<span class="count">');
        this.element.append(this.counter);
      }
      this.counter.html(count);
      if(blink){ this.blink(); }
    }
  },

  blink: function(){
    if(!GAME.loading){ this.element.stop(true).pulse({opacity: [0,1]}, {duration:100, times: 3}); }
  }
});
