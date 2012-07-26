/********************************************************************************/
// Update List

Game.Strategy.ListSwitcher = new Class({
  Extends: Game.Strategy,
  name: "ListSwitcher",

  // Return true if this is not my game
  notJoined: function(game){
    // If I created the game then manage state
    if(game.user_id == CONFIG.userId){
      GAME.event(game.user_state, game);
      return false;
    }
    return true;
  }
});

Game.Strategy.JoinGame = new Class({
  Extends: Game.Strategy.ListSwitcher,
  name: "JoinGame",

  crunch: function(game){
    if(this.notJoined(game)){
      $send($msg.update.joinGame, game);
    }
  }
});

Game.Strategy.UnjoinGame = new Class({
  Extends: Game.Strategy.ListSwitcher,
  name: "UnjoinGame",

  crunch: function(game){
    if(this.notJoined(game)){
      $send($msg.update.unjoinGame, game);
    }
  }
});

Game.Strategy.SelectAvatar = new Class({
  Extends: Game.Strategy,
  name: "SelectAvatar",

  crunch: function(game){
    $send($msg.update.avatar, game);
  }
});

Game.Strategy.UserReady = new Class({
  Extends: Game.Strategy,
  name: "UserReady",

  crunch: function(game){
    $send($msg.update.ready, game);
  }
});

// Removes the started game from the list
Game.Strategy.GameStarted = new Class({
  Extends: Game.Strategy,
  name: "GameStarted",

  crunch: function(gameId){
    $send($msg.update.removeGame, gameId);
  }
});

/************************************************************/
// Actions that manages list <=> hof <=> account states
// These actions are all executed in the user list state.
// Only the client differentiates between list, hof and account.

// Shows the list
Game.Strategy.ShowList = new Class({
  Extends: Game.Strategy,
  name: "ShowList",

  crunch: function(game){
    GAME.event(game.user_state, game);    // user_state is "list"
  }
});

// Shows the high scores
Game.Strategy.ShowHiscores = new Class({
  Extends: Game.Strategy,
  name: "ShowHiscores",

  crunch: function(game){
    if(GAME.state == 'hiscores'){
      $send($msg.update.hiscores, game.scores)
    } else {
      GAME.event('hiscores', game);
    }
  }
});

// Shows the account
Game.Strategy.ShowAccount = new Class({
  Extends: Game.Strategy,
  name: "ShowAccount",

  crunch: function(game){
    if(GAME.state == 'account'){
      $send($msg.update.account, game.account)
    } else {
      GAME.event('account', game);
    }
  }
});
