/********************************************************************************/
/* GameChat enhanced with decorators pipeline (comes with a tokenizer and a command executor) */
Game.Gui.PresenceChat = new Class({
  Extends: Game.Gui.Item,
  name: "PresenceChat",

  options: {
    template: 'presence-chat',
    channelPrefix: 'presence-chat-',
    msgEvent: 'client-chat-msg',
    sysEvent: 'client-chat-sys',
    chatHeight: 150,
    openSpeed: 250,
    typingTimeout: 4000,
    privateId: function(ids){return (ids ? ids.sort(function(a,b){return a-b}).join('-') : null);}
  },

  /* Options (all optional):
   * - ids: array of user ids to chat with
   * - filters: in out filter pipes {in: [...], out: [...]}. Example {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']}
   * - commands: (only if Command filter) managed commands [...]. Example: ['Mixer', 'Admin', 'Quit', ...] (see: game.gui.chat.commands.js)
   **/
  init: function(options){
    $log("Opening presence chat with: " + userIds, {section: 'open'});

    var self = this;
    var controller = options.controller;
    this.id = options.id; // chat id (uuid)
    this.hidden = false;  // true id the chat is in the more collection, false if the chat is visible in the slots.
    var userIds = options.ids;  // array of user ids
    var inChat = new Hash;  // chat state for every user: true => chatting, false => chat closed
    /* inChat | online
    *      0  |    0     => user offline
    *      0  |    1     => user online, but no chat (on this channel)
    *      1  |    0     => impossible
    *      1  |    1     => user online and chat open (on this channel)
    **/
    userIds.each(function(id){ inChat[id] = false; });
    var jsp = {};           // JScrollPane data
    var InFilters = [];     // every incoming message will be passed to the decorator pipeline (decorators, parsers, commands...)
    var OutFilters = [];    // every outgoing message will be passed to the decorator pipeline (decorators, parsers, commands...)
    var msgEvents = 0;      // chat message events count when the chat is closed
    var closed = false;     // closed state
    var userAdder = null;   // Object used to add new users to the chat
    var typingState = {typing: false, timeout: null};     // Whether I'm typing or not
    var typingUsers = [];

    // Messages
    var prevMsgId = -1;      // id of the previuos message used to identify more messages sent by the same player
    var messages = [];       // Messages are stored here

    // Chat channel (private chats have an id-id channel, while multichats have an uuid channel
    var channelId = (userIds.length > 2 ? this.id : this.options.privateId(userIds));
    var chatChannel = this.options.channelPrefix + channelId;
    var channelReady = false;

    /****************************************************************/
    //Selectors
    var header = this.element.find('.header');
    var typingInfo = this.element.find('.typing');
    var input = this.element.find('.send').on({
      'keyup.presence.chat': function(event){
        iType(true);
        if(event.keyCode == 13){
          iType(false);
          sendMessage();
        }
      },
      'focus.presence.chat':  function(){
        if(userAdder) userAdder.close();
      }
    });
    var view = this.element.find('.view');     // Used to animate close/open

    addJSPane();
    addFilters();
    addHeader();

    // Public methods
    this.close = close;
    this.focus = focus;
    this.show = show;
    this.hide = hide;
    this.injectSend = send;
    this.injectReceive = receiveMessage;
    // Retruns true if I'm chatting with (and only with) user id
    this.chattingWith = function(id){
      return (userIds.length == 2 && userIds.contains(id))
    };
    this.notify = notify;

    subscribeChannel();

    this.mapListeners([
      {map: $msg.presence.added, to: userOnline},      // for online/offline state notification
      {map: $msg.presence.removed, to: userOffline},  // for online/offline state notification
      {map: $msg.info.newState, to: stateChange}
    ]);

    $log({section: 'close'});

    /**************************************************************************/
    // PRIVATE FUNCTIONS
    /**************************************************************************/

    function subscribeChannel(){
      if(chatChannel){
        PUSHER.subscribe(chatChannel, function(members) {
          channelReady = true; inChat[CONFIG.userId] = true;
          members.each(function(user){ inChat[user.id] = true; })
        });
        PUSHER.bindTo(chatChannel, self.options.msgEvent, receiveMessage);
        PUSHER.bindTo(chatChannel, self.options.sysEvent, processSys);
        PUSHER.bindTo(chatChannel, 'pusher:member_added', userJoined);
        PUSHER.bindTo(chatChannel, 'pusher:member_removed', userLeaved);
      }
    }

    // (observer pattern)
    function notify(obj, event){
      if(obj == userAdder){
        if(event == Core.Events.destroyed){
          userAdder = null;
        } else {
          var user = PRESENCE.users.get(event.id);
          $log(user.nickname +  " added to chat " + self.id);

          if(userIds.length > 2){
            // This is already a multichat
            userIds.push(event.id);
            inChat[event.id] = false;
            PUSHER.trigger(chatChannel, self.options.sysEvent, {type: 'add', added: event.id, by: CONFIG.userId});
            updateHeader();
          } else {
            // This is a private chat. Creates a new chat with current users + the added one
            var newUsers = Array.clone(userIds);
            newUsers.push(event.id);
            controller.addChat(newUsers);
          }

        }

      }
    }

    /**********************************************************/
    // initialization
    function addJSPane(){
      jsp.viewport = self.element.find('.viewport');
      /* Reference to jScrollPane:
       * - http://jscrollpane.kelvinluck.com/index.html
       * - http://jscrollpane.kelvinluck.com/settings.html
       * - http://jscrollpane.kelvinluck.com/api.html */
      jsp.viewport.jScrollPane({
        stickToBottom: true,
        hideFocus: true
      });
      jsp.api = jsp.viewport.data('jsp');
      jsp.content = jsp.api.getContentPane();
    }

    // Prepares filters in/out pipelines
    function addFilters(){
      var filters = options.filters;

      if(filters){
        var incoming = filters['in'];
        var outgoing = filters['out'];
        var filterToAdd;
        try{
          $log("Incoming filter queue:", {section: 'open'});
          incoming && incoming.each(function(filterName){
            filterToAdd = filterName; // for catch
            var filter = (filterName == 'Command' ? new Game.Chat['Filter' + filterName](self, options.commands) : new Game.Chat['Filter' + filterName](self));
            InFilters.push(filter);
          });
          $log({section: 'close'});
          $log("Outgoing filter queue:", {section: 'open'});
          outgoing && outgoing.each(function(filterName){
            filterToAdd = filterName; // for catch
            var filter = (filterName == 'Command' ? new Game.Chat['Filter' + filterName](self, options.commands) : new Game.Chat['Filter' + filterName](self));
            OutFilters.push(filter);
          });
        } catch(err){
          $log("Filter: not found '" + filterToAdd + "'", {level: 'error'});
        } finally {
          $log({section: 'close'});
        }
      }
    }

    function addHeader(){
      header.find('.users').on('click.presence.chat', function(){
        // if it's hidden, invoke controller
        self.hidden ? controller.focusChat(self.id) : toggle();
      });

      // Attaches the behaviours
      header.find('.close').on('click.presence.chat', close);
      header.find('.add').on('click.presence.chat', function(){
        if(userAdder) return; // there is already the adder, ignore request
        userAdder = new Game.Gui.PresenceChatAdder({
          anchor: {custom: 'user-adder'},
          filterIds: userIds
        });
        self.appendChild(userAdder);
        self.observe(userAdder);
      });
      updateHeader();
    }

    /**********************************************************/
    // events

    // do something on user state change
    function stateChange(state){ return true; }

    // sys events in the chat channel
    function processSys(event){
      switch(event.type){
        case 'add':
          if(!userIds.contains(event.added)){
            userIds.push(event.added);
            inChat[event.added] = false;
          }
          var added = PRESENCE.users.get(event.added);
          var by = PRESENCE.users.get(event.by);
          send("/sys tell <span style='color: white;'>" + by.nickname + "</span> added <span style='color: white;'>" + added.nickname + "</span> to the chat" );
          updateHeader();
          break;
        case 'typing':
          event.on ? typingUsers.push(event.who) : typingUsers.erase(event.who);
          updateTyping();
          break
      }
    }

    function userOnline(user){
      if(userIds.contains(parseInt(user.id))){
        send("/sys tell <span style='color: white;'>" + user.info.nickname + "</span> is <span style='color: #00a400;'>online</span>");
      }
      return true;
    }

    function userOffline(user){
      user.id = parseInt(user.id);
      if(userIds.contains(parseInt(user.id))){
        send("/sys tell <span style='color: white;'>" + user.info.nickname + "</span> is <span style='color: #da4c32;'>offline</span>");
        typingUsers.erase(user.id);
        updateTyping();
      }
      return true;
    }

    // Notify message count in the header if the chat is minimized
    function notifyMessages(){
      var counter = header.find('.event-count')
      if(counter.length == 0){
        counter = $("<span class='event-count'></span>");
        header.find('.users').prepend(counter);
      }
      msgEvents++;
      counter.html("(" + msgEvents + ") ");
      // Also tells to update the more container if the chat is there
      if(self.hidden){ controller.notifyHidden(); };
    }

    // user =>{id: userId, info: {presence data} }
    function userJoined(user){
      $log("Presence chat: " + user.info.nickname + " joined the chat");
      var newId = parseInt(user.id);
      if(!userIds.contains(newId)){userIds.push(newId);}
      inChat[user.id] = true;
    }

    // user =>{id: userId, info: {presence data} }
    function userLeaved(user){
      user.id = parseInt(user.id);
      $log("Presence chat: " + user.info.nickname + " closed the chat");
      inChat[user.id] = false;
      typingUsers.erase(user.id);
      updateTyping();
    }

    /**********************************************************/
    // Behaviors

    // Opens and focuses the chat
    function show(){
      if(closed){
        toggle();
        self.hidden = false;
      } else {
        input.focus();
      }
    }

    // Minimize the chat
    function hide(){
      if(!closed){
        toggle();
        self.hidden = true;
      }
    }

    // Opens the chat if closed, closes it if it's open.
    function toggle(){
      if(closed){
        input.focus();
        view.stop(true).animate({height: self.options.chatHeight}, self.options.openSpeed);
        closed = false;
        header.find('.event-count').remove();
        msgEvents = 0;
        jsp.api.reinitialise({ contentWidth: jsp.content.width() });
        setTimeout(jsp.api.scrollToBottom, 0);
      } else {
        input.blur();
        view.stop(true).animate({height: 0}, self.options.openSpeed);
        closed = true;
      }
    }

    // Closes (destroying) the chat.
    function close(event){
      if(chatChannel) PUSHER.unsubscribe(chatChannel);
      self.destroy();
    }

    // Chat input gets focus if the chat is open
    function focus(){
      if(!closed) input.focus();
    }

    /**********************************************************/
    // Message management

    // Callback for the chat input edit box
    function sendMessage(){
      var message = input.val();
      if(message.length == 0) return;
      input.val('');
      send(message);
      if(!anyoneInChat()){ send("/sys tell No one in the chat!"); }
    }

    // Generic send message, fully filtered. Can be injected by other objects
    // using the public injectSend function.
    function send(message){
      var filtered = filterMessage(message, OutFilters);
      if(filtered.message.length > 0 && channelReady){
        var data = {id: CONFIG.userId, msg: filtered.message, at: Date.now()};
        receiveMessage(data); // shows on my chat
        PUSHER.trigger(chatChannel, self.options.msgEvent, data);  // sends to others
        notifyClosedChats(data);
      }
    }

    /* Tells the chat to receive, filter and show an incoming message.
     * Data hash contains:
     * - id: sender user id
     * - msg: text message
     * - at: timestamp (Date.now)
     * Can be injected by other objects using the public injectReceive function. */
    function receiveMessage(data){
      // First apply filters to the incoming message
      var filtered = filterMessage(data.msg, InFilters);
      if(filtered.message.length === 0) return true;

      var sameUser = (prevMsgId == data.id);
      prevMsgId = data.id;
      var chatMessage = null;
      if(sameUser){
        chatMessage = new Game.Chat.PresenceMessage({
          anchor: {custom: 'message'},
          template: 'partial-presence-chat-message',
          type: 'chat',
          msg: filtered.message,
          subs:{
            messageContent: filtered.message
          }
        });
      } else {
        chatMessage = new Game.Chat.PresenceMessage({
          anchor: {custom: 'message'},
          template: 'full-presence-chat-message',
          id: data.id,
          type: 'chat',
          msg: filtered.message,
          subs:{
            messageContent: filtered.message
          }
        });
      }
      putMessage(chatMessage);
      if(closed) notifyMessages();  // hmm, chat is closed, notify user about new messages
      if(data.id != CONFIG.userId){ // not playing sound on my own messages :)
        $send($msg.audio.fx, $fx.chat.newMessage);
      }
      $send($msg.info.tabAlert, { text: "New chat message", priority: 1 });
      return true;
    }

    function filterMessage(msg, filters){
      var bundle = {message: msg};
      filters.every(function(pipe){
        bundle = pipe.filter(bundle);
        if(bundle.error){
          putMessage(new Game.Chat.Message({
            anchor: {custom: 'message'},
            template: 'error-chat-message',
            type: 'error', msg: bundle.error,
            subs: {messageContent: bundle.error}
          }));
          prevMsgId = -1;
          return false;
        }
        if(bundle.result){
          putMessage(new Game.Chat.Message({
            anchor: {custom: 'message'},
            template: 'result-chat-message',
            type: 'result', msg: bundle.result,
            subs: {messageContent: bundle.result}
          }));
          prevMsgId = -1;
        }
        return true;
      })

      return bundle;
    }

    function putMessage(msg){
      // second expression in the || is used to take into account a small tolerance when the scrollbars first appears
      var bottom = (jsp.api.getPercentScrolledY() == 1) || (jsp.content.height() - jsp.viewport.height()) < 10;
      var scrollable = jsp.api.getIsScrollableV();
      self.appendChild(msg, jsp.content);
      messages.push(msg);
      jsp.api.reinitialise({
        contentWidth: jsp.content.width()
      });
      // Scrolls to bottom only if the chat was already scrolled to bottom or closed. (maybe closed does not work as content is hidden)
      if(closed || bottom || !scrollable) setTimeout(jsp.api.scrollToBottom, 0);
    }

    /**********************************************************/
    // Helpers

    function iType(itype){
      if(itype){
        // Typing ...
        if(typingState.typing){
          clearTimeout(typingState.timeout);
        } else {
          typingState.typing = true;
          PUSHER.trigger(chatChannel, self.options.sysEvent, {type: 'typing', on: true, who: CONFIG.userId});
        }
        typingState.timeout = setTimeout(iType, self.options.typingTimeout);
      } else {
        // Enter or timeout
        clearTimeout(typingState.timeout);
        typingState.timeout = null;
        typingState.typing = false;
        PUSHER.trigger(chatChannel, self.options.sysEvent, {type: 'typing', on: false, who: CONFIG.userId});
      }
    }

    // Returns true if there is at least one chat user online, except me :)
    function anyoneInChat(){
      return inChat.some(function(chatting, id){return (id != CONFIG.userId && PRESENCE.users[id]);})
    }

    /* If a user I'm chatting with closed the chat, I can not trigger him a message, but
     * I need to trigger an open chat event, which contains also the message I wrote to him. */
    function notifyClosedChats(data){
      inChat.each(function(chatting, id){
        if(id == CONFIG.userId) return;
        if(PRESENCE.users[id] && !chatting){
          PUSHER.userEvent(id, {type: 'chat', action: 'open', users: userIds, id: self.id, data: data});
        }
      });
    }

    function updateHeader(){
      var user, names = [];
      userIds.each(function(userId){
        if(userId == CONFIG.userId) return; // skips myself
        user = PRESENCE.users[userId];
        names.push((user && user.nickname) || '?');
      });
      var usersString = names.join(', ');
      header.find('.users').html(usersString).attr('title', usersString);
    }

    function updateTyping(){
      var names = [];
      typingUsers.each(function(id){names.push(PRESENCE.users[id].nickname)});
      if(names.length > 0){
        var postfix = (names.length > 1 ? 'are typing ...' : 'is typing ...');
        typingInfo.html("<span style='color: white;'>" + names.join(', ') + "</span> " + postfix);

      } else {
        typingInfo.empty();
      }
    }
  }

});

/********************************************************************************/
// MESSAGE
Game.Chat.PresenceMessage = new Class({
  Extends: Game.Gui.Item,
  init: function(options){
    this.type = options.type;
    this.msg = options.msg;
    if(options.id){
      this.element.prepend($('<img src="' + PRESENCE.users[options.id].image + '">'));
    }
  }
});

/********************************************************************************/
// User search and add functionality
Game.Gui.PresenceChatAdder = new Class({
  Extends: Game.Gui.Item,
  name: "PresenceChat",

  options: {
    template: 'user-adder',
    listSize: 4
  },

  init: function(options){
    var self = this;
    var searchText = '';
    var ignoreIds = options.filterIds;
    var filtered =[];
    var userList = new Hash;

    // Exposed methods
    this.close = close;

    // Behaviour
    this.element.find('.close').on('click.useradder', close);
    var searchInput = this.element.find('.search').on('keyup.presence.chat', function(event){
      if(event.keyCode == 27){
        close();
      } else {
        searchText = searchInput.val(); filter(searchText);
      }
    });

    this.mapListeners([
      {map: $msg.presence.added, to: presenceChanged},
      {map: $msg.presence.removed, to: presenceChanged},
      {map: $msg.presence.update, to: userUpdate}
    ]);

    /**************************************************************************/
    // PRIVATE FUNCTIONS
    /**************************************************************************/

    // called on user add or remove
    function presenceChanged(){
      filter(searchText);
      return true;
    }

    // called when user state changes
    function userUpdate(user){
      var entry = userList.get(user.id);
      if(entry){ entry.updateState(user.state); }
      return true;
    }

    function filter(text){
      filtered.empty();
      if(!$defined(text) || $type(text) != 'string'){ text = '' }
      if(text.length > 0){
        PRESENCE.users.each(function(user, id){
          id = parseInt(id);
          if(!ignoreIds.contains(id) && user.nickname.toLowerCase().contains(text.toLowerCase())){
            filtered.push(id);
          }
        });
        filtered.sort(function(id1, id2){return PRESENCE.users[id2].at - PRESENCE.users[id1].at});
      }
      updateSearch();
    }

    function updateSearch(){
      userList.each(function(user){
        user.destroy();
      });
      userList.empty();
      var maxUsers = Math.min(self.options.listSize, filtered.length); // read every time as may change
      for(var i = 0; i < maxUsers; i++){
        addListEntry(filtered[i]);
      }
    }

    function addListEntry(id){
      var user = PRESENCE.users.get(id);
      var entry = new Game.Gui.Presence.User({
        anchor: {custom: 'presence-user'},
        id: id,
        image: user.image,
        state: user.state,
        subs: {
          name: user.nickname
        }
      });
      userList.set(id, entry);
      self.appendChild(entry, '.filtered');
      entry.element.find('.name').off('click').on('click.useradd', function(){selectUser(id)});
    }

    function selectUser(id){
      self.notifyObservers({id: id});
      close();
    }

    function close(){
      self.destroy();
    }

  },

  afterAppend: function(){
    this.element.find('.search').focus();
  }

});