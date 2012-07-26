/************************************************************************/
// Pusher wrapper
Game.PusherSocket = new Class.Singleton({
  Extends: Core.Base,
  Implements: Options,

  options: {
  },

  initialize: function(params){
    $log("Pusher: Initializing...");
    this.setOptions(params);
    this.pusher = new Pusher(params.key, params.options);

    // Pusher connection events bindings
    this.pusher.connection.bind('connecting', this.connecting.bind(this));
    this.pusher.connection.bind('connected', this.connected.bind(this));
    this.pusher.connection.bind('unavailable', this.unavailable.bind(this));
    this.pusher.connection.bind('failed', this.failed.bind(this));
    this.pusher.connection.bind('disconnected', this.disconnected.bind(this));
    this.pusher.connection.bind('connecting_in', this.connectingIn.bind(this));

    // private functions exposed
    this.trigger = trigger;
    this.userEvent = userEvent;
    this.subscribe = subscribe;
    this.unsubscribe = unsubscribe;
    this.bindTo = bindTo;
    this.unbindFrom = unbindFrom;

    /****************************************************************************************/
    // PRIVATE FUNCTIONS
    /****************************************************************************************/
    var self = this;
    var eventBindings = new Hash;
    var userEventQueues = {};

    /* Use this method to trigger messages
     * - channelName (string): is the channel name, must be already subscribed
     * - event (string): is the event to trigger on the channel
     * - data (hash): is the data hash to send in the message */
    function trigger(channelName, event, data){
      if(isConnected()){
        var channel = self.pusher.channel(channelName);
        if(channel){
          channel.trigger(event, data);
        } else {
          $log("Pusher: '" + channelName + "' is not subscribed!", {level: 'error'});
        }
      }
    }

    // Sends an event to a specific user
    function userEvent(userId, event){
      var userChannel = self.options.user.prefix + userId;
      // The queue store incoming events while the channel is still subscribing
      var queue = userEventQueues[userChannel];
      if(queue){
        queue.push(event);
        return;
      }
      userEventQueues[userChannel] = [event];
      subscribe(userChannel, function(){
        userEventQueues[userChannel].each(function(event){
          trigger(userChannel, self.options.user.event, event);
        });
        unsubscribe(userChannel);
        delete userEventQueues[userChannel];
      });
    }

    /* Subscribe to a channel
    * - channelName: the channel name :)
    * - success (optional): success subscription callback
    * - error (optional): subscription error callback */
    function subscribe(channelName, success, error){
      if(isConnected()){
        var channel = self.pusher.subscribe(channelName);
        eventBindings[channelName] = new Hash;
        channel.bind('pusher:subscription_succeeded', function(members){  // members wil be valorized only for presence channels
          if(success) success(members);
          $log("Pusher: subscribed to channel " + channelName);
        });
        channel.bind('pusher:subscription_error', function(status){
          eventBindings.erase(channelName);
          if(error) error();
          $log("Pusher: subscription error " + status + " on channel " + channelName);
        });
      }
    }

    /* Unsubscribe from a channel */
    function unsubscribe(channelName){
      if(isConnected()){
        self.pusher.unsubscribe(channelName);
        eventBindings.erase(channelName);
        $log("Pusher: unsubscribed from channel " + channelName);
      }
    }

    /* Binds an event
     * - channelName: channel the event will be bound to
     * - eventName: event to bind
     * - callback: callback for the event. */
    function bindTo(channelName, eventName, callback){
      if(isConnected()){
        var channel = self.pusher.channel(channelName);
        if(channel){
          channel.bind(eventName, callback);
          var channelEvents = eventBindings[channelName][eventName];
          channelEvents ? channelEvents.push(callback) : eventBindings[channelName][eventName] = [callback];
        }
      }
    }

    /* Unbinds an event
     * - channelName: channel where the event is bound
     * - eventName: event to unbind
     * - callback (optional): callback to unbind. If no callback is given, all bound callbacks will be unbound. */
    function unbindFrom(channelName, eventName, callback){
      if(isConnected()){
        var channel = self.pusher.channel(channelName);
        if(channel){
          var eventCallbacks = eventBindings[channelName][eventName];
          if(callback){
            channel.unbind(eventName, callback);
            if(eventCallbacks) eventCallbacks.erase(callback);
          } else {
            if(eventCallbacks) eventCallbacks.each(function(cb){
              channel.unbind(eventName, cb);
            });
            eventBindings[channelName].erase(eventName);
          }
        }
      }
    }

    function isConnected(){
      return (self.pusher.connection.state === 'connected');
    }

  },

  /******************************************************************************/
  // Pusher connection events

  connecting: function(){
    $log("Pusher: trying to connect.");
  },

  /* at connection pusher registers automatically 2 channels:
   * - presence channel, used for user presence notification
   * - user channel, a channel that anyone can subscribe to notify events to this user (you can use the userEvent function) */
  connected: function(){
    $log("Pusher: connected.");
    var presence = this.pusher.subscribe(this.options.presence.channel);

    // Presence channel events bindings
    presence.bind('pusher:subscription_succeeded', function(members){$send($msg.presence.list, members)});
    presence.bind('pusher:member_added', function(member){$send($msg.presence.added, member)});
    presence.bind('pusher:member_removed', function(member){$send($msg.presence.removed, member)});
    presence.bind(this.options.presence.stateEvent, function(member){$send($msg.presence.update, member)});

    var user = this.pusher.subscribe(this.options.user.channel);
    user.bind(this.options.user.event, function(event){$send($msg.client.event, event)});
  },

  unavailable: function(){
    $log("Pusher: the connection is temporarily unavailable, check your connection.")
  },

  failed: function(){
    $log("Pusher: not supported by the browser (Flash not available?)")
  },

  disconnected: function(){
    $log("Pusher: connetion closed.")
  },

  connectingIn: function(delay){
    $log("Pusher: trying to reconnect in " + delay + " ms.")
  },

  state: function(){
    return this.pusher.connection.state;
  }
});
