//...Commands..............................................................................
/* They receive args (tokens) and filter (the CommandFilter). args[0] is the command itself
 * so the arguments start at args[1]. Through filter.chat you can access the chat object.
 * The run function can return a string result that will be printed in the chat.
 * Options:
 *
 * - cmd: the command name
 * - help: short help that will be showed on "/help"
 * - syntax: more in depth help that will be showed on "/help command"
 * - hidden: short help for hidden commands (use hidden instead of help)
 *
 * Note: result, help, hidden and syntax can contain html.
 **/

Game.Chat.CommandHelp = new Class({
  Extends: Core.Base,

  options:{
    cmd: 'help',
    help: 'This help.'
  },
  
  initialize: function(){
    this.parent();
    $log("Help added to commands.");
  },

  run: function(args, filter){
    var help = [];
    var hidden = args[1] == 'hidden';
    filter.commands.each(function(command){
      if(command.options.help || (hidden && command.options.hidden)) help.push(
        '<span class="command">' +
        filter.options.commandStarter +
        command.options.cmd +
        ':</span> '+
        (command.options.help || command.options.hidden)
        );
    });
    return help.join('<br/>');
  }
});

Game.Chat.CommandKonsole = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'konsole',
    hidden: 'Toggles on the output console'
  },

  initialize: function(){
    this.parent();
    this.konsole = false;
    this.panel = null;
    this.mapReceivers([
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Konsole added to commands.");
  },

  stop: function(){
    Konsole.enable(false);
  },

  run: function(args){
    var result = '';

    if(!this.konsole){
      this.panel = new Konsole.Panel;
      this.observe(this.panel);
      Konsole.enable(this.panel);
      this.konsole = true;
      result = 'Konsole Enabled.'
    }
    
    return result;
  },
  
  notify: function(panel, event){
    if(panel == this.panel && event == Core.Events.destroyed){
      this.konsole = false;
      this.panel = null;
    }
  }
});

Game.Chat.CommandMixer = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'mixer',
    help: 'Adjust audio levels. Type <b>/mixer help</b> for more help.',
    syntax: '<span class="command">Mixer command:</span> adjust fx and music audio levels.' +
            'Syntax: /mixer [fx|music|all] [0..100] where 0..100 is the volume. /mixer without ' +
            'parameters will show current volume levels.'
  },
  
  initialize: function(){
    this.parent();
    $log("Mixer added to commands.");
  },

  run: function(args){
    var result = '';
    var volume = parseInt(args[2]);

    switch(args[1]){

      case 'fx':
        if(isNaN(volume)){
          result = 'Invalid volume';
        } else {
          this.send($msg.audio.mixer, {fxVolume: volume});
          result = 'Fx volume set to ' + SOUND.fxVolume;
        }
        break;
      case 'music':
        if(isNaN(volume)){
          result = 'Invalid volume';
        } else {
          this.send($msg.audio.mixer, {musicVolume: volume});
          result = 'Music volume set to ' + SOUND.musicVolume;
        }
        break;
      case 'all':
        if(isNaN(volume)){
          result = 'Invalid volume';
        } else {
          this.send($msg.audio.mixer, {fxVolume: volume, musicVolume: volume});
          result = 'Music and fx volume set to ' + SOUND.musicVolume;
        }
        break;
      case 'help':
        result = this.options.syntax;
        break;
      default:
        result = 'Fx volume: ' + SOUND.fxVolume + '<br/>' + 'Music volume: ' + SOUND.musicVolume;
        
    }
    return result;
  }
});

Game.Chat.CommandQuit = new Class({
  Extends: Core.Base,

  options:{
    cmd: 'quit',
    help: 'Surrender and quits the current game.'
  },
  
  initialize: function(){
    this.parent();
    $log("Quit added to commands.");
  },

  run: function(){
    $send($msg.rpc.giveupGame);
  }
});

Game.Chat.CommandSniff = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'sniff',
    hidden: 'Toggles on/off the message sniffing. Type <b>/sniff help</b> for more help.',
    syntax: '<span class="command">Sniff command:</span> sniffs all or a selection of messages. ' +
            'Syntax: /sniff [msg tree]. Example /sniff, /sniff $msg.info, /sniff $msg.update.offer'
  },

  initialize: function(){
    this.parent();
    this.sniffer = null;
    this.mapReceivers([
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Sniff added to commands.");
  },

  stop: function(){
    if(this.sniffer){
      this.sniffer.destroy();
      this.sniffer = null;
    }
  },

  run: function(args){
    var result = '';
    var target = args[1];

    switch(target){
      case 'help':
        result = this.options.syntax;
        break;
      default:
        if(this.sniffer){
          this.sniffer.destroy();
          this.sniffer = null;
          result = 'Sniffer off.'
        } else {
          target = (target && target[0] == '$') ? eval(target) : $msg;
          this.sniffer = $snif(target);
          result = 'Sniffer on.'
        }
    }
    
    return result;
  }
});

Game.Chat.CommandPlacerTracer = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'placer',
    hidden: 'Toggles on/off the PlacerTracer tool'
  },

  initialize: function(){
    this.parent();
    this.pt = null;
    this.mapReceivers([
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("PlacerTracer added to commands.");
  },

  stop: function(){
    if(this.pt){
      this.pt.destroy();
      this.pt = null;
    }
  },

  run: function(){
    var result = '';
    if(this.pt){
      this.pt.destroy();
      this.pt = null;
      result = 'Placer Tracer off.'
    } else {
      this.pt = new Game.Gui.PlacerTracer;
      GUI.appendChild(this.pt);
      result = 'Placer Tracer on.'
    }
    return result;
  }
});

Game.Chat.CommandAdmin = new Class({
  Extends: Core.Base,

  options:{
    cmd: 'c',
    hidden: 'Fires an admin command :)',
    syntax: 'Really expected some help?'
  },

  initialize: function(){
    this.parent();
    $log("Admin added to commands.");
  },

  run: function(args){
    var result = '', cmd = args[1];
    var args = args.filter(function(param, i){return i > 1;});  // collects the command parameters
    if(cmd){
      if(cmd == 'help') return this.options.syntax;
      $send($msg.rpc.secretCmd, {code: cmd, args: args});
      //var result = 'Sent admin command: ' + cmd;
    } else {
      result = 'Hmmm, I think it does not work this way...';
    }
    return result;
  }
});

Game.Chat.CommandEcoMode = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'eco',
    help: 'Sacrifies game effects to consume less cpu '
  },

  initialize: function(){
    this.parent();
    this.eco = false;
    this.mapReceivers([
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("EcoMode added to commands.");
  },

  stop: function(){
    this.eco = false;
  },

  run: function(args){
    var mode = args[1]; // actually not used
    if(this.eco){
      MAP.layers.isometry.terrains.each(function(t){t.tile.play();});
      this.eco = false;
      var result = "Eco mode OFF";
    } else {
      MAP.layers.isometry.terrains.each(function(t){t.tile.pause();});
      this.eco = true;
      result = "Eco mode ON";
    }
    return result;
  }
});

Game.Chat.CommandSystem = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  options:{
    cmd: 'sys',
    hidden: 'System commands.'
  },

  initialize: function(){
    this.parent();
    $log("System added to commands.");
  },

  run: function(args){
    args.shift(); // removes the /sys command
    var result = '', cmd = args.shift();
    switch(cmd){
      case 'tell':  // /sys tell message
        result = ':: ' + args.join(' ');
        break
    }
    return "<span class='sys'>" + result + "</span>";
  }
});
