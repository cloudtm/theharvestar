/********************************************************************************/
/* GameChat enhanced with decorators pipeline (comes with a tokenizer and a command executor) */
Game.Gui.Chat = new Class({
  Extends: Game.Gui.Item,
  name: "Chat",

  options: {
    template: 'game-chat',
    chatHeight: 150,
    openSpeed: 250,
    blinkSpeed: 500,
    blinkColors: ["#FFF", "#FCA700"]  // pulsed colors for highlighting. index 0 is the default color
  },

  /* Options (all optional):
   * - open: [true | false] creates the chat opened or closed
   * - togglable: [true | false] allows the chat to be opened/closed
   * - state (string | array): the chat will respond to messages only in this/these state(s)
   * - filters: in out filter pipes {in: [...], out: [...]}. Example {in: ['StripScripts'], out: ['StripScripts', 'Tokenizer', 'Command']}
   * - commands: (only if Command filter) commands to add to the Command filter. Example: ['Mixer', 'Admin', 'Quit', ...] (see: game.gui.chat.commands.js)
   **/
  init: function(options){
    $log("Game.Gui.Chat: initializing...", {section: 'open'});
    var self = this;

    this.togglable = $defined(options.togglable) ? options.togglable : true;
    if(!this.togglable){ options.open = true; }  // corrects the open flag if the chat is not togglable

    addJSPane();

    /****************************************************************/
    //Selectors
    var handle = this.element.find('.handle');  // used to attach click and mousedown behavior
    this.input = this.element.find('.send');    // Used to read input text
    this.view = this.element.find('.view');     // Used to animate close/open
    this.highlight = this.element.find('.chat-color');  // Used to highlight new message when the chat is closed

    // Init some variable
    this.closed = !options.open;

    //Associates the chat so that it will respond only to messages in this/these state(s)
    switch($type(options.state)){
      case 'string':
        this.associatedState = [options.state];
        break;
      case 'array':
        this.associatedState = options.state;
        break;
      default:
        this.associatedState = false;
    }

    this.prevMsgId = -1;      // id of the previuos message used to identify more messages sent by the same player
    this.messages = [];       // Messages are stored here
    addFilters();

    if(this.togglable){
      handle
        .click(this.toggleChat.bind(this))
        .mousedown(function(){$send($msg.audio.fx, $fx.gui.buttonClick);});
      if(this.closed){ this.view.height(0); }
    }

    // When player press enter his message will be sent (event.keyCode == 13)
    this.input.keyup(function(event){
      if(event.keyCode == 13) this.sendMessage();
    }.bind(this));

    this.mapListeners([
      {map: $msg.info.chat, to: this.receiveMessage},
      {map: $msg.info.syscmd, to: this.systemCmd},
      {map: $msg.info.newState, to: this.reset}
    ]);
    $log("Game.Gui.Chat: OK", {section: 'close'});

    /**************************************************************************/
    // PRIVATE FUNCTIONS
    /**************************************************************************/
    function addJSPane(){
      self.viewport = self.element.find('.viewport');
      /* Reference to jScrollPane:
       * - http://jscrollpane.kelvinluck.com/index.html
       * - http://jscrollpane.kelvinluck.com/settings.html
       * - http://jscrollpane.kelvinluck.com/api.html */
      self.viewport.jScrollPane({
        stickToBottom: true,
        hideFocus: true
      });
      self.scrollApi = self.viewport.data('jsp');
      self.contentPane = self.scrollApi.getContentPane();
    }

    // Prepares filters in/out pipelines
    function addFilters(){
      self.InDecorators = [];     // every incoming message will be passed to the decorator pipeline (decorators, parsers, commands...)
      self.OutDecorators = [];    // every outgoing message will be passed to the decorator pipeline (decorators, parsers, commands...)
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
            self.InDecorators.push(filter);
          });
          $log({section: 'close'});
          $log("Outgoing filter queue:", {section: 'open'});
          outgoing && outgoing.each(function(filterName){
            filterToAdd = filterName; // for catch
            var filter = (filterName == 'Command' ? new Game.Chat['Filter' + filterName](self, options.commands) : new Game.Chat['Filter' + filterName](self));
            self.OutDecorators.push(filter);
          });
        } catch(err){
          $log("Filter: not found '" + filterToAdd + "'", {level: 'error'});
        } finally {
          $log({section: 'close'});
        }
      }
    }
  },

  // Called on state change
  reset: function(state){
    if(this.togglable){
      if(!this.closed){
        this.toggleChat();
      } else {
        this.highlight.stop().css({backgroundColor: this.options.blinkColors[0]});
      }
    }

    // Reset messages
    this.messages.each(function(msg){
      msg.destroy();
    });
    this.messages.empty();
    this.prevMsgId = -1;
  },

  /*********************************************************************/
  // Message routines

  chatDisabled: function(){
    return (this.associatedState && !this.associatedState.contains(GAME.state));
  },

  sendMessage: function(){
    var message = this.input.val();
    if(message.length == 0) return;

    this.input.val('');
    var filtered = this.filterMessage(message, this.OutDecorators);
    if(filtered.message.length > 0){
      this.send($msg.rpc.chat, message);
    }
  },

  /* message: can be any valid chat input,
  * If it's a message it will be sent to the game channel like any text written by the player
  * if it's a command it will be executed but without displaying the result in the chat. */
  systemCmd: function(message){
    // Checks for the associated state
    if(!this.chatDisabled()){
      var filtered = this.filterMessage(message, this.OutDecorators);
      if(filtered.message.length > 0){
        this.send($msg.rpc.chat, filtered.message);
      }
    }
    return true;
  },

  receiveMessage: function(msg){
    // Checks for the associated state
    if(this.chatDisabled()){ return true; }

    // First apply filters to the incoming message
    var filtered = this.filterMessage(msg.message, this.InDecorators);
    if(filtered.message.length === 0) return true;

    var samePlayer = (this.prevMsgId == msg.sender.id);
    this.prevMsgId = msg.sender.id;
    var chatMessage = null;
    if(samePlayer){
      chatMessage = new Game.Chat.Message({
        anchor: {custom: 'message'},
        template: 'partial-chat-message',
        type: 'chat', msg: filtered.message,
        subs:{
          messageContent: filtered.message
        }
      });
    } else {
      var playerInfo = GAME.players[msg.sender.id] || msg;
      chatMessage = new Game.Chat.Message({
        anchor: {custom: 'message'},
        template: 'full-chat-message',
        type: 'chat', msg: filtered.message,
        subs:{
          playerId: playerInfo.slot,
          playerName: playerInfo.name,
          messageContent: filtered.message
        }
      });
    }
    if(this.closed) this.blink();
    this.putMessage(chatMessage);
    if(msg.sender.id != GAME.pid){ // not playing sound on my own messages :)
      this.send($msg.audio.fx, $fx.chat.newMessage);
    }
    return true;
  },

  // Puts the message in the chat
  putMessage: function(msg){
    var bottom = (this.scrollApi.getPercentScrolledY() == 1);
    var scrollable = this.scrollApi.getIsScrollableV();
    this.appendChild(msg, this.contentPane);
    this.messages.push(msg);
    this.scrollApi.reinitialise({
      contentWidth: this.contentPane.width()
    });
    // Scrolls to bottom only if the chat was already scrolled to bottom or closed.
    if(this.closed || bottom || !scrollable) this.scrollApi.scrollToBottom();
  },

  filterMessage: function(msg, decorators){
    var bundle = {message: msg};
    decorators.every(function(decorator){
      bundle = decorator.filter(bundle);
      if(bundle.error){
        this.putMessage(new Game.Chat.Message({
          anchor: {custom: 'message'},
          template: 'error-chat-message',
          type: 'error', msg: bundle.error,
          subs: {messageContent: bundle.error}
        }));
        this.prevMsgId = -1;
        return false;
      }
      if(bundle.result){
        this.putMessage(new Game.Chat.Message({
          anchor: {custom: 'message'},
          template: 'result-chat-message',
          type: 'result', msg: bundle.result,
          subs: {messageContent: bundle.result}
        }));
        this.prevMsgId = -1;
      }
      return true;
    },this)

    return bundle;
  },

  // Opens the chat if closed, closes it if it's open.
  toggleChat: function(){
    if(this.closed){
      this.input.focus();
      this.view.stop(true).animate({height: this.options.chatHeight}, this.options.openSpeed);
      this.closed = false;
      this.highlight.stop().css({backgroundColor: this.options.blinkColors[0]});
    } else {
      this.input.blur();
      this.view.stop(true).animate({height: 0}, this.options.openSpeed);
      this.closed = true;
    }
  },
  
  blink: function(){
    this.highlight.stop(true).pulse(
      {backgroundColor: this.options.blinkColors},
      {duration: this.options.blinkSpeed, easing: "easeOutSine", times: 1000}
    );
  }

});

/***************************************************************/
// MESSAGE
Game.Chat.Message = new Class({
  Extends: Game.Gui.Item,
  init: function(options){
    this.type = options.type;
    this.msg = options.msg;
  }
});
