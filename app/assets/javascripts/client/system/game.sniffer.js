/*********************************************************************
 *                Personalized Game Message Sniffer
 *********************************************************************/
// This sniffer translates message ids back to strings :)
Game.Sniffer = new Class({
  Extends: Core.Dispatcher.Sniffer,
  name: "Game Sniffer",

  options: {
    colors: ["#00A000", "#F0942B", "#288EAD", "#C750A1", "#000"]
  },

  initialize: function(messages, myReceive){
    this.parent(messages, myReceive);
    this.msgMap = new Hash;
    this.messages.each(function(msg){
      this.msgId = msg;
      this.msgMap.set(msg, this.nameDecorator("$msg", 0) + "." + this.findMessage($msg, 1));
    }, this);
    if(this.customReceive){
      this.proxedReceive = this.customReceive;
      this.customReceive = this.proxyCustomReceive;
    }
  },

  receive: function(msg, data){
    this.msgId = msg;
    return this.parent(this.msgMap[msg], data);
  },

  proxyCustomReceive: function(msg, data){
    // msg is the translated msgId, we need to pass the original message to the callback
    this.proxedReceive(this.msgId, data);
  },

  findMessage: function(msg, depth){
    var msgName = null;
    $H(msg).some(function(value, name){
      if($type(value) == "number"){
        if(value == this.msgId){
          msgName = this.nameDecorator(name, depth);
          return true;
        } else {
          return false;
        }
      }
      var sub = this.findMessage(value, depth + 1);
      if(sub){
        msgName = this.nameDecorator(name, depth) + '.' + sub;
        return true;
      } else {
        return false
      }
    }, this);
    return msgName;
  },

  nameDecorator: function(name, depth){
    depth = Math.min(this.options.colors.length - 1, depth);
    return ('<span style="color:' + this.options.colors[depth] + ';">' + name + '</span>');
  },

  msgDecorator: function(msg){
    return ("<b>" + msg + "</b> => ");
  }

});

/* Overwrites the default Dispatcher sniffer,
 * see Core.Dispatcher.Sniffer for more info. */
$snif = function(messages, myReceive){
  return (new Game.Sniffer(messages, myReceive));
}