/***************************************************************************
                            Game Behaviors
***************************************************************************/
/* Versioning logic. Use:
 *
 *    Game.Versioning.isNewGame(game));
 *    Game.Versioning.isNewPlayer(player));
 *
 * where game and player are hashes with the
 * attribute 'version'. It returns true if the game
 * or player message sent by the server is new.
 * It maintains the player and game message version
 * in private variables.
 **/
Game.Versioning = new function(){
  var gameVersion = -1;
  var playerVersion = -1;

  this.isNewGame = function(game){
    if(game.version > gameVersion){
      gameVersion = game.version;
      return true;
    }
    $log('Old percept for game. Current version: ' + gameVersion + ', received: ' + game.version, {level: "warn"});
    return false;
  };

  this.isNewPlayer = function(player){
    if(player.version > playerVersion){
      playerVersion = player.version;
      return true;
    }
    $log('Old percept for player. Current version: ' + playerVersion + ', received: ' + player.version, {level: "warn"});
    return false;
  };

  this.reset = function(){
    gameVersion = -1;
    playerVersion = -1;
  }
}
