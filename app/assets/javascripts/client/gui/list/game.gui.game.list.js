/** User: marco * Date: 29/02/12 * Time: 14.10 **/
// Game list in LIST
Game.Gui.GameList = new Class({
  Extends: Game.Gui.Item,
  name: "GameList",

  options: {
    template: 'none'
  },

  init: function(options){
    this.games = new Hash; // all the offers, mine and others
    this.mapListeners([
      {map: $msg.update.joinGame, to: this.joinGame},
      {map: $msg.update.unjoinGame, to: this.unjoinGame},
      {map: $msg.update.removeGame, to: this.removeGame},
      {map: $msg.info.listStart, to: this.start},
      {map: $msg.info.listStop, to: this.stop}
    ]);
    $log("Game.Gui.GamesList: added.");
  },

  start: function(){},
  stop: function(){
    this.games.each(function(game){
      game.destroy();
    });
    this.games.empty();
  },

  /******************************************************************/
  // game actions

  joinGame: function(game){
    var entry = this.games.get(game.id);
    if(entry){
      entry.addUser(game.users[0])
    } else {
      entry = new Game.Gui.GameEntry({
        game: game
      });
      this.appendChild(entry);
      this.games.set(game.id, entry);
    }
    if(entry.machine.state != 'listed'){ Game.Helpers.showElement(entry.element); }
  },

  unjoinGame: function(game){
    var entry = this.games.get(game.id);
    if(entry){
      entry.removeUser(game.user_id);
      if(entry.joinedUsers.getLength() == 0){
        entry.destroy();
        this.games.erase(game.id);
      }
    }
  },

  // Removes a started game from the list
  removeGame: function(gameId){
    var entry = this.games.get(gameId);
    if(entry){
      this.games.erase(gameId);
      entry.destroy();
    }
  }

});
