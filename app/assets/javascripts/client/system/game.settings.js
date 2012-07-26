/* Settings is a simple key value store */
Game.Settings = new Class.Singleton({
  Extends: Core.Base,
  name: 'Settings',

  options:{
    saveDelay: 1000   // wait these ms before saveing settings
  },

  initialize: function(settings){
    this.parent();
    this.data = settings || {};
    this.saveTimer = null;
  },

  /* Writes a setting (writes in the hash).
  * - key (string): is a dot separated key. Examples: 'param', 'audio.fx', 'global.audio.music'
  * - value (hash, array, string, number): the value to associate to the key*/
  write: function(key, value){
    if(!(key && $defined(value)) || $type(key) != 'string'){ return null; }
    var changed = false;
    var path = key.split('.');
    var depth = path.length, level = this.data;
    for(var index = 0; index < depth; index++){
      if(index == depth -1){
        if(level[path[index]] !== value){
          level[path[index]] = value;
          changed = true;
        }
      } else {
        var valType = $type(level[path[index]]);
        if(!(valType == 'hash' || valType == 'object')){
          level[path[index]] = {};
        };
        level = level[path[index]];
      }
    }
    if(changed){
      // Notifies the observers for the key change
      this.notifyObservers({key: key, value: value});
      // Saves the settings to the server
      this.sync();
    }
    return value;
  },

  /* Reads a setting (reads from the hash).
  * - key (string): is a dot separated key (see write). You can retrieve a whole set of settings
  * by specifying a more generic path, ex:
  * Stored values:
  *   audio.fx = fx params
  *   audio.music = music params
  * if you read:
  *   audio.fx you get => fx params
  * but if you read
  *   audio you get both => {fx: ..., music: ...} params*/
  read: function(key){
    if(!key || $type(key) != 'string'){ return null; }
    var path = key.split('.');
    var depth = path.length, level = this.data;
    for(var index = 0; index < depth; index++){
      level = level[path[index]];
      if(!$defined(level)){ return null; }
    }
    return level;
  },

  /* Utility function to chek if a key is contained in another key.
  * It's designed for an intuitive use:
  *     SETTINGS.key('a.b.c.d').in('a.b')
  * Returns true if the first key is contained in the second one,
  * false otherwise. The in() parameter is suppeosed to be more
  * general (or equal) than key() parameter. */
  key: function(key){
    return new function(){
      this.in = function(inKey){
        var depth = inKey.length;
        for(var i=0; i < depth; i++){
          if(inKey[i] != key[i]){ return false}
        }
        return true;
      }
    };
  },

  // Saves settings data to the server
  sync: function(){
    var self = this;
    if(!CONFIG.saveSettings){ return; }

    if(this.saveTimer){ clearTimeout(this.saveTimer); }
    this.saveTimer = setTimeout(save, this.options.saveDelay);

    function save(){
      $send($msg.rpc.saveSettings, JSON.stringify(self.data));
      self.saveTimer = null;
    }
  }

});