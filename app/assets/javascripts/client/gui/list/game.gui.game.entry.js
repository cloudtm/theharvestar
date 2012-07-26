/** User: marco * Date: 29/02/12 * Time: 14.10 **/
// Game entry in LIST
Game.Gui.GameEntry = new Class({
  Extends: Game.Gui.Item,
  name: "GameEntry",

  options: {
    template: 'game-entry'
  },

  init: function(options){
    this.id = options.game.id;
    this.me = null; // shortcut for my user (plain hash)

    this.joinedUsers = new Hash;
    this.layerObjects = [];
    this.dim = {  // various dimensions to adjust join button width dynamically
      gameEntry: 0,
      joinedUser: 0,
      joinMargin: 0
    };
    this.layers = {
      listed: this.element.find('.listed'),
      select: this.element.find('.select'),
      joined: this.element.find('.joined')
    };

    // Point of interesest: dynamically updated content that can be present in any layer
    this.poi = {
      player: this.element.find('.my-player'),              // Player N + player-n class
      avatarName: this.element.find('.avatar-name'),        // selected avatar name
      selectedAvatar: this.element.find('.selected-avatar') // selected avatar image in joined state
    };

    // Creates JOIN buttons. These buttons are shown/hidden by arrangeJoinButtons function.
    this.joinBtn = [];
    for(var join = 1; join <= 4; join ++){
      var button = new Game.Gui.Button({
        template: 'none',
        anchor: {custom: 'btn-join'},
        text: "<span></span>",
        call: this.join.bind(this),
        klass: 'player-' + join,
        store: join
      });
      this.appendChild(button, this.layers.listed.find('.p' + join));
      this.joinBtn.push(button);
    }

    this.machine = new Core.FSM;
    this.machine
      .addState({name: 'init', leave: this.leaveState.bind(this)})
      .addState({name: 'listed', enter: this.enterState.bind(this), leave: this.leaveState.bind(this)})
      .addState({name: 'select', enter: this.enterState.bind(this), leave: this.leaveState.bind(this)})
      .addState({name: 'joined', enter: this.enterState.bind(this), leave: this.leaveState.bind(this)})

      // Init transitions
      .addTransition({from: 'init', to: 'listed', event: 'listed', doing: this.onTransition.bind(this)})
      .addTransition({from: 'init', to: 'select', event: 'select', doing: this.onTransition.bind(this)})
      .addTransition({from: 'init', to: 'joined', event: 'joined', doing: this.onTransition.bind(this)})

      // Game entry runtime transitions
      .addTransition({from: 'listed', to: 'select', event: 'join', doing: this.onTransition.bind(this)})
      .addTransition({from: 'select', to: 'joined', event: 'select', doing: this.onTransition.bind(this)})
      .addTransition({from: 'joined', to: 'select', event: 'back', doing: this.onTransition.bind(this)})
      .addTransition({from: 'select', to: 'listed', event: 'unjoin', doing: this.onTransition.bind(this)})
      .addTransition({from: 'joined', to: 'listed', event: 'unjoin', doing: this.onTransition.bind(this)})

    // Selects the right layer
    this.me = this.joined(options.game);
    var toState = this.me ? (this.me.player.avatar == 'none' ? 'select' : 'joined') : 'listed';
    this.machine.event(toState, options.game);

    this.mapReceivers([
      {map: $msg.info.chat, to: this.decorateMessage}
    ]);

    this.mapListeners([
      {map: $msg.update.avatar, to: this.avatarSelected}     // decorates chat message adding player infos
    ]);
  },

  /***************************************************************/
  // State management
  leaveState: function(state, options){
    this.layerObjects.each(function(obj){ obj.destroy(); });
    this.layerObjects.empty();

    switch(state){
      case 'init':
        this.createUsers(options);  // options => game
        if(this.me){ this.poi.selectedAvatar.addClass(this.me.player.avatar); };
        break;
      case 'listed':
        this.poi.player.html('Player ' + this.me.player.slot).addClass('player-' + this.me.player.slot);
        this.poi.selectedAvatar.addClass('player-' + this.me.player.slot);
        break;
      case 'select':
        break;
      case 'joined':
        this.unlisten($msg.info.chat);
        break;
    }
  },

  onTransition: function(transition, options){
    switch(transition){
      case 'listed => select':
        this.layers.select.show();
        this.layers.listed.hide();
        // resize
        break;
      case 'select => joined':
        this.layers.joined.show();
        this.layers.select.hide();
        break;
      case 'joined => select':
        this.layers.select.show();
        this.layers.joined.hide();
        break;
      case 'select => listed':
        this.layers.listed.show();
        this.layers.select.hide();
        // resize
        break;
      case 'joined => listed':
        this.layers.listed.show();
        this.layers.joined.hide();
        // resize
        break;

      // Init transitions
      case 'init => listed':
        break;
      case 'init => select':
      case 'init => joined':
        this.poi.player.html('Player ' + this.me.player.slot).addClass('player-' + this.me.player.slot);
        this.poi.selectedAvatar.addClass('player-' + this.me.player.slot);
        break;
    }
  },

  enterState: function(state, options){
    // Reappends users to the new active layer
    this.moveUsers();

    switch(state){

      /* LISTED ***********************************************/
      case 'listed':
        // I still have this.me when switching state (not when loading and I'm not joined)
        if(this.me){
          this.poi.player.removeClass('player-' + this.me.player.slot);
          this.poi.selectedAvatar.removeClass('player-' + this.me.player.slot);
          this.poi.selectedAvatar.removeClass(this.me.player.avatar);
        };
        this.arrangeJoinButtons();
        break;

      /* SELECT ***********************************************/
      case 'select':
        var as = new Game.Gui.AvatarSelector({ anchor: {custom: 'avatar-selector'}, subs: {slot: this.me.player.slot} });
        this.layerObjects.push(as);
        this.observe(as);
        this.appendChild(as, this.layers.select);
        as.select(CONFIG.avatars.indexOf(this.me.player.avatar));

        var btnUnjoin = new Game.Gui.Button({ anchor: {custom: 'btn-unjoin'}, template: 'none', text: "LEAVE GAME", call: this.unjoin.bind(this) });
        this.layerObjects.push(btnUnjoin);
        this.appendChild(btnUnjoin, this.layers.select);

        var btnSelect = new Game.Gui.Button({ anchor: {custom: 'btn-select'}, template: 'none', text: "SELECT", call: this.select.bind(this) });
        this.layerObjects.push(btnSelect);
        this.appendChild(btnSelect, this.layers.select);
        break;

      /* JOINED ***********************************************/
      case 'joined':
        btnUnjoin = new Game.Gui.Button({ anchor: {custom: 'btn-unjoin'}, template: 'none', text: "LEAVE GAME", call: this.unjoin.bind(this) });
        this.layerObjects.push(btnUnjoin);
        this.appendChild(btnUnjoin, this.layers.joined);

        var btnBack = new Game.Gui.Button({ anchor: {custom: 'btn-back'}, template: 'none', text: "BACK TO CHARACTER SELECTION", call: this.backToSelect.bind(this) });
        this.layerObjects.push(btnBack);
        this.appendChild(btnBack, this.layers.joined);

        var chat = new Game.Gui.Chat({
          anchor: {custom: 'joined-chat'},
          state: 'join',
          togglable: false,
          filters: {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']},
          commands:['Konsole', 'Sniff', 'PlacerTracer', 'Mixer', 'System']
        });
        this.layerObjects.push(chat);
        this.appendChild(chat, this.layers.joined);
        this.listen($msg.info.chat, 1);
        break;
    };
  },

  // Do some measurement on the elements. This way we are free to modify css.
  afterAppend: function(){
    this.layers[this.machine.state].show();
    this.dim.gameEntry = this.element.find('.listed .users').width();
    this.dim.joinedUser = this.element.find('.joined-user').width();
    this.dim.joinMargin = parseInt( this.joinBtn[0].element.css('marginRight') );
    this.arrangeJoinButtons();
  },

  /***************************************************************/
  // User operations

  // Adds a player to the entry
  addUser: function(user){
    this.createUser(user);
    var joinedCount = this.joinedUsers.getLength();
    if(user.id == CONFIG.userId){  // I joined
      this.me = user;
      this.machine.event('join');
    } else {
      if(joinedCount >= 4 && !this.me){ this.element.hide(); }; // Hide the game entry if full
      this.moveUsers();
    }
    if(this.machine.state == 'listed'){
      this.arrangeJoinButtons();
    } else {
      this.notifyObservers({name: 'userCount', num: joinedCount});
    }
  },

  // Removes a player from the game entry
  removeUser: function(userId){
    // removes a player and change state if it was me
    var ju = this.joinedUsers.get(userId);
    ju.destroy();
    this.joinedUsers.erase(userId);
    if(userId == CONFIG.userId){  // I left
      this.machine.event('unjoin');
      this.me = null;
    } else {
      if(!this.element.is(':visible')){ this.element.show(); } // Shows the game entry
      this.moveUsers();
    }
    if(this.machine.state == 'listed'){
      this.arrangeJoinButtons();
    } else {
      this.notifyObservers({name: 'userCount', num: this.joinedUsers.getLength()});
    }
    $send($msg.presence.update, {id: userId, state: 'list'});  // updates the presence user state
  },

  /***************************************************************/
  // Button actions
  join: function(event, slot){
    if(GAME.state == 'list'){
      $send($msg.rpc.joinGame, {slot: slot, id: this.id});
    }
  },

  select: function(){
    $send($msg.rpc.selectAvatar, this.me.player.avatar);
  },

  backToSelect: function(){
    // If I was ready, toggles ready to false
    if(this.joinedUsers[this.me.id].ready){ $send($msg.rpc.ready); }
    this.machine.event('back');
  },

  unjoin: function(){
    $send($msg.rpc.unjoinGame);
  },

  /***************************************************************/
  // Messages responders

  // If I selected the avatar switches state
  avatarSelected: function(game){
    if(game.user_id == CONFIG.userId) { this.machine.event('select'); };
    return true;
  },

  decorateMessage: function(msg){
    var ju = this.joinedUsers[msg.user_id];
    msg.slot = ju.user.player.slot;
    msg.name = ju.user.nickname;
    return true;
  },

  /***************************************************************/
  // other functions

  // Creates the users when creating or reloading game
  createUsers: function(game){
    // Adds all game users that joined the game
    game.users.each(function(user){ this.createUser(user); }, this);
    if(game.users.length >= 4 && !this.me){ this.element.hide(); }; // Hide the game entry if full
    this.notifyObservers({name: 'userCount', num: this.joinedUsers.getLength()});
  },

  createUser: function(user){
    var ju = new Game.Gui.JoinedUser({
      user: user,
      gameEntry: this,
      subs: {
        name: user.nickname,
        slot: user.player.slot,
        avatar: user.player.avatar
      }
    });
    this.appendChild(ju);
    this.joinedUsers.set(user.id, ju);
    $send($msg.presence.update, {id: user.id, state: 'join'});  // updates the presence user state
    return ju;
  },

  // Reappends joined users objects to the new active layer (machine.state)
  moveUsers: function(){
    // list is a special case as it has slots
    var where = this.layers[this.machine.state].find('.users');
    if(this.machine.state == 'listed'){
      this.joinedUsers.each(function(ju){
        ju.appendTo(where.find('.p' + ju.user.player.slot));
      });
    } else {
      this.joinedUsers.each(function(ju){
        // hides me if in select (joined users appended to this.element are hidden by default)
        if(this.machine.state == 'select' && ju.id == CONFIG.userId) {
          ju.appendTo(this.element);
          return;
        };
        ju.appendTo(where);
      }, this);
    }
  },

  arrangeJoinButtons: function(){
    if(this.dim.gameEntry == 0) return;

    var usedSlots = [false, false, false, false];
    var juCount = 0;
    this.joinedUsers.each(function(ju){ usedSlots[ju.user.player.slot - 1] = true; });
    usedSlots.each(function(used, slot){
      var btn = this.joinBtn[slot].element;
      used ? (juCount++, btn.hide()) : btn.show();
    }, this);

    // Adjust join buttons size
    var free = this.dim.gameEntry - juCount * this.dim.joinedUser;
    var joinWidth = (free / (4 - juCount)) - 2 * this.dim.joinMargin;
    this.element.find('.btn-join').width(joinWidth.floor());
  },

  // returns my user data if I joined
  joined: function(game){
    var me = null;
    game.users.some(function(user){
      if(user.id == CONFIG.userId) me = user;
      return me;
    });
    return me;
  },

  // I observe only the avatar selector so do not need to check for obj
  notify: function(obj, event){
    if(event == Core.Events.destroyed) return;  // Ignore avatar selector destruction
    if(event.select){
      this.select();
    } else{
      this.poi.selectedAvatar.removeClass(this.me.player.avatar);
      this.me.player.avatar = event.avatar;   // updates the avatar short name directly in my player information
      this.poi.selectedAvatar.addClass(this.me.player.avatar);
      this.poi.avatarName.html(CONFIG.avatarsInfo[event.avatar].name);
    }
  }
});

/***************************************************************/
// Avatar selector allows to chose the avatar.
// API: abserver pattern with event: {avatar: "avatar name"}
Game.Gui.AvatarSelector = new Class({
  Extends: Game.Gui.Item,
  name: "AvatarSelector",

  options: {
    template: 'avatar-selector',
    availableAvatars: 7,
    grid: {cols: 2, rows: 4, dx: 122, dy: 122}, // vertical stripe specification
    horAvatarWidth: 235,
    horSpeed: 1000,           // horizonatl avatars change animation speed
    verSpeed: 300             // vertical avatars box moving speed
  },

  init: function(options){
    var self = this;

    this.horSelector = this.element.find('.horizontal-selector');
    this.verSelector = this.element.find('.vertical-selector');

    /* Reference to jScrollPane: http://jscrollpane.kelvinluck.com/index.html */
    this.verSelector.jScrollPane({
      stickToBottom: true,
      hideFocus: true
    });
    this.scrollApi = this.verSelector.data('jsp');
    this.contentPane = this.scrollApi.getContentPane();

    // Prepares the vertical avatars stripe.
    var verStripe = $("<div class='stripe'></div>");
    this.selectionBox = $("<div class='box'></div>");
    verStripe.append(this.selectionBox);
    this.contentPane.append(verStripe);
    setTimeout(this.scrollApi.reinitialise, 0); // reinitialization is done as soon as the control returns to the browser

    verStripe.on({
      'click.avatars': function(event){ self.onBoxClick(event, $(this)); },
      'mousedown.avatars': function(){ $send($msg.audio.fx, $fx.gui.buttonClick); }
    });

    // attach events to arrows
    this.horSelector.find('.arrow.left').on({
      'click.avatars': function(event){ self.onArrowClick(-1); },
      'mousedown.avatars': function(){ $send($msg.audio.fx, $fx.gui.buttonClick); }
    });
    this.horSelector.find('.arrow.right').on({
      'click.avatars': function(event){ self.onArrowClick(+1); },
      'mousedown.avatars': function(){ $send($msg.audio.fx, $fx.gui.buttonClick); }
    });
  },

  // avatar is a number
  select: function(avatar){
    var self = this;
    avatar = Math.min(this.options.availableAvatars - 1, Math.max(0, avatar));

    var newSelection = CONFIG.avatars[avatar];
    if(newSelection == this.avatar){
      this.notifyObservers({select: true})
      return;
    }
    this.avatar = newSelection;

    // Selects the correct avatar full image
    this.horSelector.stop(true).animate({'background-position': (- this.options.horAvatarWidth * avatar) + 'px 0px'}, this.options.horSpeed);

    // Places the selections box
    var col = avatar % this.options.grid.cols;
    var row = Math.floor(avatar / this.options.grid.cols);
    this.selectionBox.stop(true).animate(
      {left: col * this.options.grid.dx, top: row * this.options.grid.dy},
      {duration: this.options.verSpeed, step: function(){ self.scrollApi.scrollToElement(self.selectionBox); }}
    );

    this.notifyObservers({avatar: this.avatar})
  },

  // direction is 1 or -1
  onArrowClick: function(direction){
    var currAvatar = CONFIG.avatars.indexOf(this.avatar);
    var newAvatar = Math.min(this.options.availableAvatars - 1, Math.max(0, currAvatar + direction));
    if(newAvatar != currAvatar){ this.select(newAvatar); }
  },

  onBoxClick: function(event, target){
    var off = target.offset();
    var x = event.pageX - off.left;
    var y = event.pageY - off.top;

    var col = Math.floor(x / this.options.grid.dx);
    var row = Math.floor(y / this.options.grid.dy);
    var avatar = row * this.options.grid.cols + col;
    this.select(avatar);
  }
});

/***************************************************************/
// Joined user entry
Game.Gui.JoinedUser = new Class({
  Extends: Game.Gui.Item,
  name: "JoinedUser",

  options: {
    template: 'joined-user'
  },

  init: function(options){
    var self = this;
    this.avatarCircle = this.element.find('.avatar');
    this.readyButton = this.element.find('.ready');

    this.user = options.user;
    this.avatar = this.user.player.avatar;  // updated by updateAvatar()
    this.ready = this.user.player.ready;
    this.wait = true;
    this.id = this.user.id;

    if(this.id == CONFIG.userId){
      this.element.addClass('me')
      this.readyButton.on({
        'click.ready': function(){ if(!self.wait){ $send($msg.rpc.ready);} },
        'mousedown.ready': function(){ if(!self.wait){$send($msg.audio.fx, $fx.gui.buttonClick);} }
      });

    } else {
      this.element.addClass('other');
    }
    this.element.find(".fb-image").css('background-image', 'url(' + this.user.image_url + ')');

    // Receives notifications on number of joined users. Used to update ready state.
    this.observe(options.gameEntry);

    this.mapListeners([
      {map: $msg.update.avatar, to: this.updateAvatar},
      {map: $msg.update.ready, to: this.updateReady}
    ]);
  },

  appendTo: function(where){
    this.element.appendTo(where);
  },

  updateAvatar: function(game){
    if(game.user_id != this.id) return;
    this.avatarCircle.removeClass(this.avatar);
    this.user = game.users[0];
    this.avatar = this.user.player.avatar;
    this.avatarCircle.addClass(this.avatar);
  },

  updateReady: function(game){
    if(game.user_id != this.id) return;
    this.user = game.users[0];
    this.ready = this.user.player.ready;
    this.adjustReady();
  },

  // Updates the ready button. It is both for me and for others, css differentiates the style.
  adjustReady: function(){
    if(this.wait){
      this.readyButton.html('WAIT');
    } else {
      if(this.ready){
        this.readyButton.html('GO!');
        this.readyButton.addClass('go');
      } else {
        this.readyButton.html('READY?');
        this.readyButton.removeClass('go');
      }
    }
  },

  notify: function(obj, event){
    if(event == Core.Events.destroyed) return;  // ignores game destruction
    if(event.name == 'userCount'){
      if(event.num < CONFIG.gameOptions.min_player_limit){
        this.ready = false;
        this.readyButton.addClass('wait');
        this.wait = true;
      } else {
        this.readyButton.removeClass('wait');
        this.wait = false;
      }
      this.adjustReady();
    }
  }
});
