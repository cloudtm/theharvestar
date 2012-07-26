/* Stores in the public users variable the presence list:
 * - users: an hash of user ids and their presence data
 *          {id:
 *            {
 *              nickname: 'user nickname',
 *              image: 'user image url',
 *              state: 'user.state',
 *              at: Date
 *            },
 *           ...
 *          }
 **/
Game.Presence = new Class.Singleton({
  Extends: Core.Base,
  Implements: Core.Dispatchable,
  name: "Presence",

  // - playing: array of user ids in play/end state
  initialize: function(playing){
    var self = this;
    this.users = new Hash; // user {id: {nickname: 'user nickname', image: 'user image url', state: 'user.state', at: Date}, ... }
    var bufferedStates = {};

    this.mapListeners([
      {map: $msg.presence.list, to: usersList, priority: 1},
      {map: $msg.presence.added, to: userAdded, priority: 1},
      {map: $msg.presence.removed, to: userRemoved, priority: 1},
      {map: $msg.presence.update, to: userUpdate, priority: 1},
      {map: $msg.info.newState, to: stateChanged}
    ]);

    /****************************************************************************************/
    // PRIVATE FUNCTIONS
    /****************************************************************************************/

    function usersList(members){
      members.each(function(member){
        // force states as the state info from pusher presence list is not up to date
        member.info.state = bufferedStates[member.id] || (playing.contains(parseInt(member.id)) ? 'play' : 'list');
        member.info.at = Date.parse(member.info.at);
        self.users[member.id] = member.info;
      });
      self.me = self.users[CONFIG.userId];
      Hash.each(bufferedStates,function(b,a){delete this[a];}); // empty :)
      return true;
    }

    function userAdded(member){
      member.info.at = Date.parse(member.info.at);
      self.users[member.id] = member.info;  // state here is up to date
      //$log("Member added: " + member.id + ', ' + JSON.stringify(member.info));
      return true;
    }

    function userRemoved(member){
      delete self.users[member.id];
      //$log("Member leaved: " + member.id + ', ' + JSON.stringify(member.info));
      return true;
    }

    // - member: {id: #, state: 'user state'}
    function userUpdate(member){
      // If we still do not have the presence list (pusher takes some time to respond)
      // we store the new member state in a temporary hash for later use (in usersList)
      if(!self.me){
        bufferedStates[member.id] = member.state;
      } else {
        var user = self.users[member.id];
        user.state = member.state;
      }
      //$log("Member updated: " + member.id + ', ' + JSON.stringify(user));
      return true;
    }

    // Updates the states list/join => play, play/end => list
    // join and unjoin states are detected in the game list object (messages sent from inside
    function stateChanged(state){
      var presenceState = (['play', 'end'].contains(state) ? 'play' : state); // merges play & end states in 1 single state: play
      if(self.me && self.me.state != presenceState && ['list', 'play'].contains(presenceState)){
        $send($msg.presence.update, {id: CONFIG.userId, state: presenceState}); // sends the update so it can be listened by others
        PUSHER.trigger(CONFIG.pusher.presence.channel, CONFIG.pusher.presence.stateEvent, {id: CONFIG.userId, state: presenceState});
      }
      return true;
    }

  }

});
