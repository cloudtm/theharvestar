/***************************************************************/
//                     Decoration Filters                      //
/***************************************************************/

// Base Message filter
Game.Chat.Filter = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,

  initialize: function(chat){
    this.parent();
    this.chat = chat;
  },

  // filter is expected to be an hash like {message: 'my string...'[, other key/values]}
  filter: function(bundle){
    return bundle;
  }

});

/*****************************************************/
//Tokenizer Filter

// IN: {message: '...'}
// OUT: {message: '...', tokens: [,,,]}
Game.Chat.FilterTokenizer = new Class({
  Extends: Game.Chat.Filter,

  options:{
    separator: ' '
  },
  
  initialize: function(chat){
    this.parent(chat);
    $log("FilterTokenizer added to filter queue.");
  },

  filter: function(bundle){
    //bundle.message = bundle.message.trim();
    bundle.tokens = bundle.message.trim().replace(/\s+/g,' ').split(this.options.separator);
    return bundle;
  }

});

/*****************************************************/
//Strip scripts filter

// IN: {message: '...'}
// OUT: {message: '...'}
Game.Chat.FilterStripScripts = new Class({
  Extends: Game.Chat.Filter,
  
  initialize: function(chat){
    this.parent(chat);
    $log("FilterStripScripts added to filter queue.");
  },

  filter: function(bundle){
    bundle.message = bundle.message.stripScripts();
    return bundle;
  }

});

/*****************************************************/
//Command Filter

// IN:  {message: '...', tokens: [,,,]}
// OUT: {message: '...', tokens: [,,,]}
//        but if message is a command:
//      {message: '', tokens: [], result|error: '...'}
Game.Chat.FilterCommand = new Class({
  Extends: Game.Chat.Filter,

  options:{
    commandStarter: '/',
    defaultCommands: ['Mixer', 'System']
  },

  initialize: function(chat, commands){
    $log("FilterCommand: added to filter queue. Initializing...", {section: 'open'});
    this.parent(chat);
    this.commands = [new Game.Chat.CommandHelp];
    if(!commands) commands = this.options.defaultCommands;
    try{
      var cmdToAdd;
      commands.each(function(cmd){
        cmdToAdd = cmd;
        this.commands.push(new Game.Chat['Command' + cmd]);
      }, this);
    } catch(err) {
      $log("Command Filter: unknown command '" + cmdToAdd + "'", {level: 'error'});
    }
    $log("FilterCommand: OK", {section: 'close'});
  },

  filter: function(bundle){
    if(bundle.message.length == 0) return bundle;

    var isCommand = bundle.message[0] == this.options.commandStarter;
    if(isCommand){
      var executed = false;
      this.commands.some(function(command){
        if(bundle.tokens[0] == (this.options.commandStarter + command.options.cmd) ){
          bundle.result = command.run(bundle.tokens, this);
          executed = true;
          return true;
        }
        return false;
      }, this)
      if(!executed) bundle.error = 'Error: <b>' + bundle.tokens[0] + '</b> is not a command.'
      bundle.message = '';
      bundle.tokens.empty();
    }
    return bundle;
  }

});
