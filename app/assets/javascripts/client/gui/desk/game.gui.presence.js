Game.Gui.Presence = new Class({
  Extends: Game.Gui.Item,
  name: "Presence",

  options: {
    template: 'presence-panel',
    toggleSpeed: 250       // open/close speed
  },

  init: function(options){
    var self = this;
    var userCount = this.element.find('.count');
    var users = new Hash;
    var searchText = '';
    var filtered = [];  // ordered, filtered presence users
    this.update = updateUserPanel;  // public hook to private function
    this.element.find('.header').on('click.presence.panel', this.toggle.bind(this));
    var searchInput = this.element.find('.search').on({
      keyup: function(event){ searchText = searchInput.val(); filter(searchText); }
    });

    this.opened = SETTINGS.read('gui.presence.open');
    this.observe(SETTINGS);

    this.mapListeners([
      {map: $msg.presence.list, to: userList},
      {map: $msg.presence.added, to: presenceChanged},
      {map: $msg.presence.removed, to: presenceChanged},
      {map: $msg.presence.update, to: userUpdate}
    ]);

    /****************************************************************************************/
    // PRIVATE FUNCTIONS
    /****************************************************************************************/

    /**************************************/
    // Receivers
    function userList(){
      presenceChanged();
      if(self.opened){ adjustPanelHeight(); }
      return true;
    }

    // called on user add or remove
    function presenceChanged(){
      updateUserCount();
      filter(searchText);
      titleAlert();
      return true;
    }

    // called when user state changes
    function userUpdate(user){
      var entry = users.get(user.id);
      if(entry){
        entry.updateState(user.state);
        titleAlert();
      }
      return true;
    }

    /**************************************/
    // Common functions
    function updateUserCount(){
      userCount.html(PRESENCE.users.getLength() + " ONLINE");
    }

    // Re-renders the presence panel from the filtered list
    function updateUserPanel(){
      users.each(function(user){
        user.destroy();
      });
      users.empty();
      var maxUsers = Math.min(SETTINGS.read('gui.presence.entries'), filtered.length); // read every time as may change
      for(var i = 0; i < maxUsers; i++){
        addUser(filtered[i]);
      }
      adjustPanelHeight();
    }

    // puts an user entry in the panel (used by updateUserPanel)
    function addUser(id){
      var user = PRESENCE.users.get(id);
      var entry = new Game.Gui.Presence.User({
        anchor: {custom: 'presence-user'},
        id: parseInt(id),
        image: user.image,
        state: user.state,
        subs: {
          name: user.nickname
        }
      });
      users.set(id, entry);
      self.appendChild(entry, '.users');
    }

    function adjustPanelHeight(){
      if(self.opened){
        var panelHeight = self.element.find('.content').height();
        self.element.css('height', panelHeight);
      }
    }

    // Alert on browser tab
    function titleAlert(){
      $send($msg.info.tabAlert, {
        text: "(" + PRESENCE.users.getLength() + ") Users Online",
        priority: 0
      });
    }

    /**************************************/
    // Filter function

    // Filters all presence users by a text string (if any) and sorts the result
    // by usery login time from most recent to less recent. The updateUserPanel()
    // will pickup only first N users of this filtered list, where N is configured
    // in the settings ('gui.presence.entries').
    function filter(text){
      filtered.empty();
      if(!$defined(text) || $type(text) != 'string'){ text = '' }
      PRESENCE.users.each(function(user, id){
        if(user.nickname.toLowerCase().contains(text.toLowerCase())){
          filtered.push(id);
        }
      });
      filtered.sort(function(id1, id2){return PRESENCE.users[id2].at - PRESENCE.users[id1].at});
      updateUserPanel();
    }
  },

  // adjust presence panel if the numbers of entries to display changes
  notify: function(obj, event){
    if(obj == SETTINGS && event.key == 'gui.presence.entries'){ this.update(); }
  },

  // presence panel open/close
  toggle: function(){
    if(this.opened){
      this.element.stop(true,true).animate({height: 23}, this.options.toggleSpeed);
      this.opened = false;
    } else {
      var panelHeight = this.element.find('.content').height();
      this.element.stop(true,true).animate({height: panelHeight}, this.options.toggleSpeed);
      this.opened = true;
    }
  }

});

/*******************************************************************/
// User entry
Game.Gui.Presence.User = new Class({
  Extends: Game.Gui.Item,
  name: "Presence.User",

  options: {
    template: 'presence-user'
  },

  init: function(options){
    this.id = options.id;
    this.element.append($('<img src="' + options.image + '">'));
    this.state = this.element.find('.state');
    this.states = {
      list: CONFIG.translation({key: 'gui.presence.list_state_title'}),
      join: CONFIG.translation({key: 'gui.presence.join_state_title'}),
      play: CONFIG.translation({key: 'gui.presence.play_state_title'})
    }
    this.element.find('.name').on('click.presence.user', function(){ $send($msg.chat.create, options.id); });
    this.updateState(options.state);
  },

  updateState: function(state){
    this.state.attr('class', 'state ' + state);     // updates the state
    this.element.attr('title', this.states[state]); // sets the simple title popup

  }
});