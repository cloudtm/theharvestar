Game.Gui.PresenceChats = new Class({
  Extends: Game.Gui.Item,
  name: "PresenceChats",

  options: {
    template: 'none',
    maxChats: 4,
    chatWidth: 200,
    chatMargin: 10,
    uuidSize: 20    // see http://www.broofa.com/Tools/Math.uuid.htm
  },

  init: function(options){
    var self = this;
    var chats = {more: [], slots: []};

    // Creates dynamically the chat footer divs ....................
    var rightPos = 0;
    for(var i=0; i < this.options.maxChats; i++){
      this.element.append($("<div class='slot chat" + i + "'></div>").css({
        right: rightPos,
        width: this.options.chatWidth
      }));
      rightPos += this.options.chatWidth + this.options.chatMargin;
      chats.slots.push(false);
    }
    var moreChats = $("<div class='slot more'><span class='info'></span><div class='chats'></div></div>").css({
      right: rightPos
    });
    this.element.append(moreChats);
    //..............................................................

    // notify exposed for observed notifications
    this.notify = notify;
    this.getChat = getChat;
    this.addChat = addChat;
    this.focusChat = focusChat; // needs the data returned by getChat
    this.notifyHidden = updateMore;

    this.mapListeners([
      {map: $msg.chat.create, to: chatWith},
      {map: $msg.client.event, to: chatEvent}
    ]);

    /****************************************************************************************/
    // PRIVATE FUNCTIONS
    /****************************************************************************************/

    /**********************************************************/
    // Chat request events

    // When someone else added me to a chat
    function chatEvent(event){
      if(event.type != 'chat') return;
      switch(event.action){
        case 'open':  // open carries also a chat message
          // search id is:
          // - the chat uuid for multiuser chat
          // - the user id whom I'm talking to for private chats
          var searchId = event.users.length > 2 ? event.id : event.users.filter(function(user){return user != CONFIG.userId})[0];
          var chatData = getChat(searchId);
          var chat = (chatData && chatData.chat) || addChat(event.users, event.id);
          chat.injectReceive(event.data);
          break;
      }
    }

    // When I click on a user in the presence panel
    function chatWith(userId){
      if(userId == CONFIG.userId) return; // Ignores a chat with myself
      var chatData, userIds = [CONFIG.userId, userId];
      if(chatData = getChat(userId)){     // focuses an already open chat
        focusChat(chatData);
        return;
      }
      addChat(userIds); // new chat between me and the clicked user
      //PUSHER.userEvent(userId, {type: 'chat', action: 'open', ids: userIds});
    }

    /**********************************************************/
    // Chat creation
    // creates a new chat between N users.
    function addChat(userIds, id){
      userIds = userIds.map(function(uid){return parseInt(uid);});
      var chat = new Game.Gui.PresenceChat({
        x: 0, y: 0, anchor: {y: 'bottom'},
        id : id || Math.uuid(self.options.uuidSize),
        filters: {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']},
        commands : ['System'],
        ids: userIds,
        controller: self
      });
      self.observe(chat);
      self.appendChild(chat); // it will be moved in the placeChat function
      placeChat(chat);
      return chat;
    }

    function placeChat(chat){
      var freeSlot = chats.slots.indexOf(false);
      if(freeSlot >= 0){
        toSlot(chat, freeSlot);
      } else {
        toSlot(chat, self.options.maxChats - 1);
      }
      chat.focus();
    }

    /**********************************************************/
    // Slots managament functions
    function updateSlots(){
      var firstAvailable = compactChats();
      if(firstAvailable >= 0){
        var more2slots = Math.min(self.options.maxChats - firstAvailable, chats.more.length);
        for(var i = 0; i < more2slots; i++){
          var chat = chats.more.pop();
          toSlot(chat, firstAvailable++);
          chat.show();
        }
        if(more2slots > 0) updateMore();
      }
    }

    // compacts the chats in the free slots and return the index of first available slot, or -1 if all occupied
    function compactChats(){
      for(var pos = 0; pos < self.options.maxChats; pos++){
        if(chats.slots[pos]) continue;
        for(var found = pos + 1; found < self.options.maxChats; found++){
          var toMove = chats.slots[found];
          if(toMove){
            toSlot(toMove, pos);
            chats.slots[found] = false;
            break;
          }
        }
        // if there are no more chats to move, return the free pos index
        if(found == self.options.maxChats) return pos;
      }
      return -1;
    }

    /**********************************************************/
    // Observed chats notifications on close
    // - obj is a chat
    function notify(obj, event){
      if(event == Core.Events.destroyed){
        var slot = chats.slots.indexOf(obj);
        if(slot >= 0){
          chats.slots[slot] = false;
          updateSlots();
        } else {
          var more = chats.more.indexOf(obj);
          if(more >= 0){
            chats.more[more] = null;
            chats.more = chats.more.clean(); // removes nulls
            updateMore();
          }
        }
      }
    }

    /**********************************************************/
    // Utilities
    /* input:
     * - id: id of the user I'm chatting with, or uuid
     * output:
     * - {
     *  hidden: [true if in more|false if in slots],
     *  index: chat index in the slot array,
     *  chat: chatObj
     * }
     */
    function getChat(id){
      var chat, i;
      var match = ($type(id) == 'string' ? function(){return (chat.id == id)} : function(){return chat.chattingWith(id)});
      for(i=0; i < self.options.maxChats; i++){
        chat = chats.slots[i];
        if(chat && match()) return {hidden: false, index: i, chat: chat};
      }
      for(i=0; i < chats.more.length; i++){
        chat = chats.more[i];
        if(chat && match()) return {hidden: true, index: i, chat: chat};
      }
      return null;
    }

    // Focuses a chat.
    // - chatData: is the chat descriptor returned by getChat. If it's an int or a string (chat id)
    //             it will bw used to get the chat having that id.
    // If the chat is in slots, focuses the input, if the chat is in more,
    // brings it in the last slot swapping chats and fouces its input.
    function focusChat(chatData){
      if($type(chatData) != 'object'){ chatData = getChat(chatData) };
      if(chatData.hidden){
        var lastSlot = self.options.maxChats - 1;
        chats.more[chatData.index] = null;
        toSlot(chatData.chat, lastSlot);
      }
      chatData.chat.show();
    }

    // updates the more slot, where are the hidden chats
    function updateMore(){
      var counter = moreChats.find('.more-events');
      if(chats.more.length){
        var moreInfo = moreChats.find('.info');
        moreChats.show();
        moreInfo.html('+' + chats.more.length + ' chats');  // note: removes more-events counter
        moreChats.stop(true,true).effect("highlight", {color: '#109C26'}, 2000);

        // Update events count
        var events = 0;
        moreChats.find('.event-count').each(function(){
          var count = $(this).html();
          events += parseInt(count.trimRight().substr(1,count.length - 2)); // removes brackets "(n)"
        });

        if(events > 0){
          counter = $("<span class='more-events'></span>");
          moreInfo.prepend(counter);
          counter.html("(" + events + ") ");
        }
      } else {
        moreChats.hide();
      }
    }

    // Use: puts a chat inito a slot. It does not check if the chat comes from more
    // so you have to clean more before adding it to a slot. It also does not move chats
    // in the free slots, but if it finds that the destination slot is taken, moves that
    // chat into more.
    // Used internally with care :)
    function toSlot(chat, index){
      var taken = chats.slots[index];
      chats.slots[index] = chat;
      chat.element.appendTo(self.element.find('.chat' + index));
      if(taken){
        chats.more.push(taken);
        taken.element.appendTo(moreChats.find('.chats'));
        taken.hide();
        chats.more = chats.more.clean();
        updateMore();
      }
    }

  }

});
