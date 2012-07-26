/********************************************************************************
 *  Shows informations in the avatar popup
 **/
Game.Gui.Info = new Class({
  Extends: Game.Gui.Item,
  name: "Info",

  options: {
    template: 'none',
    defaultType: 'info'
  },

  init: function(options){
    this.lastMessage = null;
    this.mapListeners([
      {map: $msg.info.popup, to: this.showInfos}
    ]);
    $log("Game.Gui.Info: added.");
  },

  /* infos is an array of messages. Each message has this form:
  * {
  *   contest (string): 'action name'
  *   level (number): relevance level
  *   type (string): type of the message (es. "result")
  *   subs (hash): { ... message substitutions ...  }
  *   key (string): message key
  *   options (any): other options. You can change defaul fx sound using options.sound = 'fx name'
  * }
  * The only requested field is key.
  * The actual message is taken from CONFIG.gameLocales that contains all translated messages. Simply use:
  *   CONFIG.translation(message)
  * to get the translated message. message must have .key and optionally .subs to apply message substitutions,
  * so it's safe to pass to CONFIG.translation the whole message to get the translated and substituted message.
  **/
  showInfos: function(infos){
    // Removes the last message if still alive
    if(this.lastMessage){ this.lastMessage.destroy(); }

    if($type(infos) != 'array'){ infos = [infos]; }
    // Finds the most relevan message (relevance is given by the message level)
    var message = {level: -1};
    infos.each(function(info){
      if((info.level || 0) > message.level) message = info;
    });

    if(!message.type){ message.type = this.options.defaultType; }

    // Prints the most relevant message
    var fullInfo = CONFIG.translation(message);
    this.lastMessage = new Game.Gui.PopupMessage({
      anchor: {custom: 'popup-message'},
      subs: {
        slot: GAME.me.slot,
        infoMessage: fullInfo,
        avatar: GAME.me.avatar
      }
    });
    this.lastMessage.element.find('.icon').addClass(message.type);
    this.appendChild(this.lastMessage);
    this.observe(this.lastMessage);

    var fx = $fx.popup[message.type]
    if(message.options && message.options.sound){ fx = $fx.popup[message.options.sound]; }
    if(fx){ this.send($msg.audio.fx, $fx.popup[message.type]); }
    return true;
  },

  // Notifies message destruction
  notify: function(obj, event){
    if(event == Core.Events.destroyed) this.lastMessage = null;
  }

});

Game.Gui.PopupMessage = new Class({
  Extends: Game.Gui.Item,

  options: {
    template: 'popup-message',
    duration: 15000,
    fade: 500
  },

  init: function(options){
    var self = this;
    this.element.on({
      'click.popup': function(event){ self.destroy(); },
      'mousedown.popup': function(){ $send($msg.audio.fx, $fx.gui.buttonClick); },
      'mousemove.popup': function(event){ event.stopPropagation(); }
    });

    new Core.MouseEventsForwarder(this.element);

    this.tr = new Core.Transitions;
    this.tr.add('fade', {ease: 'OutSine', duration: this.options.fade});
    this.time = 0;
  },

  afterAppend: function(){
    var message = this.element.find('.text');
    message.css('top', (84 - message.height()) >> 1);
    this.animate();
  },

  tick: function(delta){
    this.time += delta;
    if(this.time < this.options.duration) return true;

    var fadeOut = 1 - this.tr.swing(this.time - this.options.duration).fade;
    this.element.css({opacity: fadeOut});

    if(this.time >= this.options.duration + this.options.fade){
      this.destroy();
      return false;
    }
    return true;
  }

});
