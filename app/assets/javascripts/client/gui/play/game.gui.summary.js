/********************************************************************************/
/* Summary display gui item. */
Game.Gui.Summary = new Class({
  Extends: Game.Gui.Item,
  name: "Summary",

  options: {
    template: 'summary',
    speed: 250    //selection bar move speed
  },

  init: function(options){
    this.activeObjects = [];
    this.users = [];
    this.selector = this.element.find('.selection');
    this.detail = this.element.find('.detail');
    this.poi = {
      winner: this.element.find('.winner'),
      avatar: this.element.find('.avatar')
    };

    // Hidden by default
    this.element.hide();

    this.mapListeners([
      {map: $msg.info.summary, to: this.showSummary},
      {map: $msg.info.summaryLeaved, to: this.leaved},
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Game.Gui.Summary: added.");
    return;
  },

  start: function(){},

  stop: function(){
    // Garbages active objects
    this.activeObjects.each(function(obj){ obj.destroy(); });
    this.activeObjects.empty();

    // Empties users
    this.users.each(function(user){ user.destroy(); });
    this.users.empty();

    // Resets pois
    this.poi.winner.attr('class', 'winner');
    this.poi.avatar.attr('class', 'avatar');

    // Other resets
    this.detail.empty();
    if(this.buttons){
      this.buttons.share.empty();
      this.buttons = null;
    }

    // Hides summary and modal cover
    this.element.hide();
    GAME.gui.find('.summary-cover').hide();
  },

  leaved: function(pid){
    var player = GAME.players[pid];
    if(player){
      var msg = "<span class='name player-" + player.slot + "'>" + player.name + "</span> left the game.";
      $send($msg.info.syscmd,"/sys tell " + msg)
    }
  },

  showSummary: function(game){
    GAME.gui.find('.summary-cover').show();

    // Set winner player
    var winnerSlot = GAME.players[game.winner_id].slot;
    this.poi.winner.addClass('player-' + winnerSlot).html('Player ' + winnerSlot);

    // CHAT
    var chat = new Game.Gui.Chat({
      anchor: {custom: 'summary-chat'},
      state: 'end',
      togglable: false,  // forces open status
      filters: {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']},
      commands:['Konsole', 'Sniff', 'PlacerTracer', 'Mixer', 'System']
    });
    this.activeObjects.push(chat);
    this.appendChild(chat);

    // Buttons
    var btnLeave = new Game.Gui.Button({
      anchor: {custom: 'btn-leave'},
      template: 'none',
      text: "LEAVE GAME",
      call: function(){$send($msg.rpc.leaveGame);}
    });
    this.activeObjects.push(btnLeave);
    this.appendChild(btnLeave);

    this.buttons = {
      share: this.element.find('.share'),
      detail: new Game.Gui.Button({ anchor: {custom: 'btn-detail'}, template: 'none', text: "DETAILS", call: this.showDetails.bind(this) }),
      prev: new Game.Gui.Button({ anchor: {custom: 'btn-prev'}, template: 'none', text: "<< PREV", call: this.prev.bind(this) }),
      back: new Game.Gui.Button({ anchor: {custom: 'btn-back'}, template: 'none', text: "BACK", call: this.showList.bind(this) }),
      next: new Game.Gui.Button({ anchor: {custom: 'btn-next'}, template: 'none', text: "NEXT >>", call: this.next.bind(this) })
    }

    this.activeObjects.push(this.buttons.detail);
    this.appendChild(this.buttons.detail);

    this.activeObjects.push(this.buttons.prev);
    this.appendChild(this.buttons.prev);
    this.buttons.prev.element.hide(); // Hidden in list

    this.activeObjects.push(this.buttons.back);
    this.appendChild(this.buttons.back);
    this.buttons.back.element.hide(); // Hidden in list

    this.activeObjects.push(this.buttons.next);
    this.appendChild(this.buttons.next);
    this.buttons.next.element.hide(); // Hidden in list

    // Creates the UserEntries
    var position = 0;
    var otherPlayers = [];  // other players for fb summary
    game.summary.each(function(player){ // players are order from higher score (winner) to lower score
      var info = GAME.players[player.id];
      var ue = new Game.Gui.UserEntry({
        anchor: {custom: 'user-entry'},
        user: player,
        position: position++, // 0..3
        subs: {
          pos: position,  // 1..4
          name: player.user_name,
          slot: info.slot,
          avatar: info.avatar,
          score: player.total_score
        }
      });
      this.appendChild(ue, '.users');
      this.users.push(ue);
      this.observe(ue);

      // If it's me prepares some information for FB share
      if(player.id == GAME.pid){
        this.fbSummary = {
          position: position - 1,  // note that position here goes from 0 to 3
          score: player.total_score
        }
      } else {
        otherPlayers.push(player.user_name);  // Used for the FB share to extract other playres names
      }
    }, this);
    this.fbSummary.others = otherPlayers;
    this.setupShare();

    // Highlights the winner
    this.selected = 0;
    this.highlight(true);

    this.element.show("fade");
    return true;
  },

  highlight: function(fast){
    if(fast){
      this.selector.css('top', (this.selected * 65) - 10);
    } else {
      this.selector.stop(true).animate({top: (this.selected * 65) - 10}, this.options.speed);
    }
    this.updateAvatar();
  },

  updateAvatar: function(){
    this.poi.avatar.attr('class', 'avatar');
    var ue = this.users[this.selected];
    this.poi.avatar.addClass(ue.info.avatar + ' player-' + ue.info.slot);
  },

  // User entry click
  notify: function(obj, event){
    if(event == Core.Events.destroyed) return;  // ignores game destruction
    if($defined(obj.position)){
      this.selected = obj.position;
      this.highlight();
    }
  },

  /*************************************************************************/
  // BUTTONS
  // Show the details for the selected user
  showDetails: function(){
    this.buttons.detail.element.hide();
    this.buttons.share.hide();
    this.buttons.prev.element.show();
    this.buttons.back.element.show();
    this.buttons.next.element.show();
    this.detail.show();
    this.selector.css('top', -10);  // selects always first row in detail as only 1 user is shown
    this.showUserDetails();
    this.adjustButtons();
  },

  // Shows the list
  showList: function(){
    this.buttons.detail.element.show();
    this.buttons.share.show();
    this.buttons.prev.element.hide();
    this.buttons.back.element.hide();
    this.buttons.next.element.hide();
    this.detail.hide();
    this.detail.empty();
    this.users.each(function(ue){ ue.element.show(); });
    this.highlight();
  },

  // prev user in detail view
  prev: function(){
    this.selected = Math.max(0, this.selected - 1);
    this.updateAvatar();
    this.detail.empty();
    this.showUserDetails();
    this.adjustButtons();
  },

  // next user in detail view
  next: function(){
    this.selected = Math.min(this.users.length -1, this.selected +1);
    this.updateAvatar();
    this.detail.empty();
    this.showUserDetails();
    this.adjustButtons();
  },

  showUserDetails: function(){
    // Shows only the selected user
    this.users.each(function(ue, i){
      if(i == this.selected){
        ue.element.show();
        // Structures ************************
        var struct = $('<div class="outpost base l1_' + ue.info.slot + '"><span class="count">' + ue.info.map.outposts + '</span></div>');
        this.detail.append(struct);
        struct = $('<div class="station base l2_' + ue.info.slot + '"><span class="count">' + ue.info.map.stations + '</span></div>');
        this.detail.append(struct);
        struct = $template("longest-path-template", {slot: ue.info.slot, length: ue.user.longest_path});
        this.detail.append(struct);

        // Awards ************************
        var show = ue.user.game_awards.transport_score > 0 ? '' : ' off';
        var struct = $('<div class="award transport' + show + '"></div>');
        this.detail.append(struct);
        show = ue.user.game_awards.social_score > 0 ? '' : ' off';
        var struct = $('<div class="award social' + show + '"></div>');
        this.detail.append(struct);
        show = ue.user.cultural_level > 0 ? '' : ' off';
        var struct = $('<div class="award cultural' + show + '"><span class="count">' + ue.user.cultural_level + '</span></div>');
        this.detail.append(struct);

      } else {
        ue.element.hide();
      }
    }, this);
  },

  // Enales/disables prev and next buttons
  adjustButtons: function(){
    this.selected === 0 ? this.buttons.prev.enable(false) : this.buttons.prev.enable(true);
    this.selected === (this.users.length -1) ? this.buttons.next.enable(false) : this.buttons.next.enable(true);
  },
  /*************************************************************************/

  setupShare: function(){
    // Create feed description
    var summary = GAME.players[GAME.pid].name + " played a game on TheHarvestar";
    if(this.fbSummary.others.length > 0) { summary +=  " with " + this.fbSummary.others.join(', ') }
    summary += " obtaining the " + ["first", "second", "third", "forth"][this.fbSummary.position] + " position and winning " + this.fbSummary.score + " points!";

    // Ref: http://support.addthis.com/customer/portal/articles/381263-addthis-client-api#configuration-sharing
    var sharedObj = {
      //url: 'http://theharvestar.com',
      title: 'The Harvestar',
      description: summary
      //More params => swfurl:	null, width: null, height:	null, email_template:	null, email_vars:	null
    }

    var shareHtml = '';
    var bigButtons = CONFIG.share.bigButtons ? ' addthis_32x32_style' : '';
    CONFIG.share.services.each(function(service){ shareHtml += '<a class="addthis_button_' + service + bigButtons + '"></a>'; });
    this.buttons.share.html(shareHtml);
    addthis.toolbox(this.buttons.share.get(0), CONFIG.share.config, sharedObj);

    // feed callback that hides the share button if the feed is being posted
    var hideShare = function(response){
      if(response) {
        this.btnShare.element.fadeOut(250);
      }
    }
  }

});

/********************************************************************************/
/* Player Summary display gui item. */
Game.Gui.UserEntry = new Class({
  Extends: Game.Gui.Item,
  name: "UserEntry",

  options: {
    template: 'user-entry'
  },

  init: function(options){
    var self = this;
    this.user = options.user;
    this.position = options.position;
    this.stats = Game.Helpers.userLevel(this.user.user_score);
    this.info = GAME.players[this.user.id];
    this.element.find(".fb-image").css('background-image', 'url(' + this.user.user_img + ')');

    this.element.on({
      'click.user.summary': function(){ self.notifyObservers(); },
      'mousedown.user.summary': function(){ $send($msg.audio.fx, $fx.gui.buttonClick); }
    });
    // Fill next level bar
    //$(".fill", userRoot).width(stats.percentage);
  }

});

Game.Gui.SummaryCover = new Class({
  Extends: Game.Gui.Item,

  options: {
    template: 'none'
  }
});
