/************************************************************************/
// Socky callbacks
var Madmass = Madmass || {};  // delete when integrated in Madmass
Madmass.Socky = new Class.Singleton({
  Extends: Core.Base,

  options: {
    // Human readable states for websocket
    states: ['CONNECTING', 'AUTHENTICATING', 'OPEN', 'CLOSED', 'UNAUTHENTICATED'],
    pingSpeed: 30000
  },

  initialize: function(server){
    this.parent();
    this.ready = false;
    this.socky = null;  // Socky instance
    this.openPending = false;   // An open is pending on the onClose event
    this.pendingChannels = null;  // pending channels to open

    this.host = server.host;
    this.port = server.port;
    this.client = "client_id=" + server.clientChannel;  // Parameter for client p2p channel

    this.url = '';  // channels parameter string
    this.pingInterval = null; // ping interval timer
  },

  /* Subscribes one or more channels. Used Socky requires to close and recreate the socky object to do that.
   * - channels (array): optional array of strings where each string is a channel to open.
   *  If no channels is specified, then subscribes the channels that are in pending state. */
  subscribe: function(channels){
    this.pendingChannels = channels;  // stores or replaces the pending channels to open
    if(!this.openPending){
      if(this.socky){
        $log("Socky: closing with pending open.");
        this.openPending = true;
        this.close();
      } else {
        this.open(channels);
      };
    }
  },

  /* Setups a (websocket) socky connection creating a new instance destroying the previous one if any.
   * - channels (optional array): array of channels. Ex: ['channel1', 'mychannel',...]
   * NOTE: whatever you specifiy in channels, the open function will always open the client channel (ptp server <=> client)
   **/
  open: function(channels){
    $log("Socky: opening " + (channels ? channels.join(',') : '()'));
    // Setups the parameters
    var params = [this.client];
    if(channels && $type(channels) == "array"){
      params.append( ["channels[]=" + channels.join(',')] );
    }

    // Creates a new Socky object
    this.socky = new Socky(this.host, this.port, params.join('&'));

    this.url = this.socky.socket.URL || this.socky.socket.url;
    this.openPending = false;
    $log("Socky: opened " + this.url);
  },

  // Closes a (websocket) socky connection destroying socky instance.
  close: function(){
    if(this.socky){
      $log("Socky: closing.");
      this.url = '';
      var socky = this.socky;
      this.socky = null;
      socky.socket.close();
    }
  },

  /* States: CONNECTING = 0, AUTHENTICATING = 1, OPEN = 2, CLOSED = 3, UNAUTHENTICATED = 4
   * - human: [true|false] if human => state is a string, if !human => state is the number */
  state: function(human){
    var state = 3;
    if(this.socky) { state = this.socky.state; }
    return (human ? this.options.states[state] : state);
  },

  // Called after connection but before authentication confirmation is received
  // At this point user is still not allowed to receive messages
  onConnect: function(){
    $log('Socky: connected.');
    // activates the ping every 30 seconds to mantain open the websocket TCP connection
    this.pingInterval = setInterval(this.ping.bind(this), this.options.pingSpeed);
  },

  // Called when connection is broken between client and server
  // This usually happens when user lost his connection or when Socky server is down.
  // Return a number of milliseconds before trying to reconnect. Return 0 to not reconnect.
  // you can also manually reconnect using thw socky instance: socky.connect()
  onDisconnect : function(){
    $log('Socky: disconnected, retrying in 1 sec...');
    this.ready = false;
    return 1000;
  },

  // Called when connection is opened
  onOpen: function(){
    $log('Socky: opened.');
  },

  // Called when socket connection is closed
  onClose: function(){
    $log('Socky: closed.');
    this.ready = false;
    // deactivate the ping
    clearInterval(this.pingInterval);
    if(this.openPending){
      $log("Socky: opening pending channels.");
      this.open(this.pendingChannels);
    }
  },

  // Called when authentication confirmation is received.
  // At this point user will be able to receive messages
  onAuthSuccess: function(){
    $log('Socky: authenticated and ready.');
    this.ready = true;
  },

  // Called when authentication is rejected by server
  // This usually means that secret is invalid or that authentication server is unavailable
  // This method will NOT be called if connection with Socky server will be broken - see respond_to_disconnect
  onAuthError: function(){
    $log('Socky: authentication failure.');
  },

  // Called when new message is received
  // Note that msg (percepts) is not sanitized - it can be any script received.
  onMessage: function(msg){
    $log('Socky: received message.');
    try{
      var percepts = JSON.parse(msg);
      percepts.each(function(percept) {
        CLIENT.event(percept.data.event, percept.data);
      });
    }catch(e){
      $log("Invalid message: " + msg);
    }

  },

  // This method is used to mantain opened the websocket TCP connection, it simply sends a message to the socky server
  // and the TCP idle timeout never fires, this type of messages are available only for an admin connection so the Socky
  // Server will respond with: "Invalid message: You are not authorized to post messages". This is not a problem, we want
  // to use this hack only to mantain the connection opened, we don't want to "show the socky connections"!
  ping: function(){
    if(this.socky){ this.socky.socket.send(JSON.stringify({command: 'query', type: 'show_connections'})); }
  }
})
