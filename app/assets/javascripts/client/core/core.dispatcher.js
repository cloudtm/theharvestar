/* Message dispatching extension for Gamecore library
 * © Algorithmica 2010
 * */

Core.extensionInitializer(function(){
  Core.dispatcher = Core.Dispatcher.getInstance();
  $send = Core.dispatcher.dispatch.bind(Core.dispatcher);
});

/*********************************************************************
 *                            DISPATCHER
 *********************************************************************/

Core.Dispatcher = new Class.Singleton({
  Extends: Core.Base,
  Implements: Options,
  name: "Dispatcher",

  options: {
    defaultPriority: 0, // higher is more important (see priorityOrder function)
    priorityOrder: function(a,b){return (b-a);},
    debug: false        // outputs debugging info into console?
  },

  /* Dispatch table contains queues in this way (listN is a listener):
   * {
   *  'msg1' => {0 => [ list1 ], 10 => [ list2 ]},
   *  'msg2' => {2 => [ list3 ], 11 => [ list 1]}
   * }
   * first level key is the message id. Each message id points to an hash. This hash
   * contains the message queues, one for every priority.
   **/
  dispatchTable: new Hash,

  /* Lisener table is a different representation of the dispatch table.
   * {
   *  list1.id => {'msg1' => 0, 'msg2' => 11},
   *  list2.id => {'msg1' => 10},
   *  list3.id => {'msg2' => 2}
   * }
   * It's used for administrative purposes like unlistening and removing a listener.
   * It allows us to have an O(1) acces time withot having to search for the listener
   * in every message id hash, in all priority queues.
   **/
  listenersTable: new Hash,

  initialize: function(options){
    this.parent();
    this.setOptions(options);
  },

  /* Disaptches incoming message to all listeners, delivering it to higher priorities listeners first.
   *
   * - msg: message id to dispatch
   * - data: message payload (optional)
   *
   * NOTE: when receiving a message, a listener can return true or false.
   * - true: continue to deliver the message to all listeners, to all remaining priority queues.
   * - false: delivers the message to this same priority queue, but skips lower priority queues.
   **/
  dispatch: function(msg, data){
    var messageQueue = this.dispatchTable.get(msg);
    if(!$defined(messageQueue)){
      if(this.options.debug) Konsole.warn("Core.Dispatcher: no listener for: " + msg); // NO listener for this message
      return;
    }

    var orderedPriorities = messageQueue.getKeys().sort(this.options.priorityOrder);

    var bubble = true;
    orderedPriorities.every(function(priority){
      var priorityQueue = messageQueue[priority]
      priorityQueue.each(function(listener){
        bubble = listener.receive(msg, data) && bubble;
      }, this);
      return bubble; // if false stops the every iterator
    }, this);

  },

  /* Insert the requester as listener for the message specified.
   *
   * params: {msg: msgIdToListen, p: anyInteger, listener: listenerObject}
   *
   * msgIdToListen: an unique id (a string or a number).
   * p: an integer that indicates the priority of the message. Higher
   *    number means higher priority. Listeners with higher priority
   *    are messaged first.
   * listenerObject: the listener object. It must implement the Dispatchable module.
   * 
   * Returns: the dispatcher itself so you can chain dispatcher methods.
   **/
  listen: function(params){
    if( !(params && params.msg && params.listener) ){
      throw "Core.Dispatcher.listen: invalid parameters!";
    }

    var msgId = params.msg;
    var listener = params.listener;
    var listenerId = listener.objectId;
    var listenerQueue = this.listenersTable.get(listenerId);

    /* Does not allows to re-listen an already listening message. As side effect
     * you are not allowed to change priority. To do so you have to unlisten the message
     * and then listen it again with different priority. */
    if(listenerQueue && $defined(listenerQueue[msgId])){
      return this;
    }

    /***** Updates dispacthTable **********************/

    // Gets the message queue, or creates a new one
    var messageQueue = this.dispatchTable.get(msgId);

    // Creates the new queue if not already present in the dispatchTable
    if(!messageQueue){
      messageQueue = new Hash;
      this.dispatchTable.set(msgId, messageQueue);
    }
    
    // Gets the priority queue for the message, or creates a new one
    var priority = params.p || this.options.defaultPriority;
    var priorityQueue = messageQueue.get(priority)

    // Creates the new priority queue if not already present in the message queue
    if(!priorityQueue) {
      priorityQueue = [];
      messageQueue.set(priority, priorityQueue);
    }

    // Adds the listener object.
    priorityQueue.push(listener);
    
    /***** Updates listenersTable **********************/

    if(!listenerQueue){
      listenerQueue = new Hash;
      this.listenersTable.set(listenerId, listenerQueue);
    }
    listenerQueue.set(msgId, priority)

    // Observe the listener so when it is destroyed we can receive a notification
    // and remove it from the dispatchTable
    this.observe(listener);
    
    return this;
  },

  /* Removes a listener from listening a message id.
   * - params: {msg: msgIdToListen, listener: listenerObject}
   * If the listener is not listening any other message, removes it completely
   * from the dispatcher and stops observing it.
   *
   * Returns: the dispatcher itself so you can chain dispatcher methods.
   **/
  unlisten: function(params){
    var listenerId = params.listener.objectId;
    var msgId = params.msg;
    var listenerQueues = this.listenersTable[listenerId];

    if(listenerQueues && $defined(listenerQueues[msgId])){
      this.unbind(params.listener, msgId);
      listenerQueues.erase(msgId);  // sync listenersTable

      /* If we removed the last message listened by this listener, we remove
       * it completely from the dispatcher and stops observing it. */
      if(listenerQueues.getLength() == 0){
        this.listenersTable.erase(listenerId);
        this.unobserve(params.listener);
      }
    }
    return this;
  },

  /* Removes the listener from the dispatcher
   * Returns: the dispatcher itself so you can chain dispatcher methods.
   **/
  remove: function(listener){
    var listenerId = listener.objectId;
    var listenerQueues = this.listenersTable[listenerId];

    if(listenerQueues){
      listenerQueues.each(function(priority, msgId){
        this.unbind(listener, msgId, priority);
      }, this);

      // removes listener from the dispatcher and stop observing it
      this.listenersTable.erase(listenerId);
      //this.unobserve(listener);
      /* In the new observer pattern implementation, with observers and observed,
       * unobserving is done automatically at object destruction
       * (the only event we are interested in) */
    }
    return this;
  },

  notify: function(listener, event){
    if(event == Core.Events.destroyed){
      this.remove(listener);
    }
  },

  /* Unbinds listener from msgId so it will not receive msgId events enymore.
   * - listener: listener that don't want to listen msgId events anymore :)
   * - msgId: the message id we don't want to listen anymore :))
   * - priority: optional parameter that specifies the priority where to look for the priorityQueue.
   *             If not specified we use the listenersTable to get the priority for the msgId.
   *
   * NOTE: this function just manages the dispatchTable. It does not sync the listenersTable
   *       nor it unsubscribes listeners (for efficiency reasons this is done by calling methods).
   **/
  unbind: function(listener, msgId, priority){
    priority = priority || this.listenersTable[listener.objectId][msgId];

    var messageQueue = this.dispatchTable[msgId];
    var priorityQueue = messageQueue[priority];

    priorityQueue.erase(listener);

    // Removes the priorityQueue if empty.
    if(priorityQueue.length == 0){
      messageQueue.erase(priority);
      // Removes also messageQueue for the msgId if empty
      if(messageQueue.getLength() == 0){
        this.dispatchTable.erase(msgId);
      }
    }
      
  }

});

/*********************************************************************/
// An utility funciton to generate unique ids (numbers). Note that the
// id variable is private and cannot be manipulated.

Core.Dispatcher.idGenerator = function(){
	var messageId = 1;
	this.newId= function(){return messageId++;};
	return this
}
// Use this simply calling $newMessageId() to generate an unique id.
$newMsgId = (new Core.Dispatcher.idGenerator).newId;

/*********************************************************************/
/* Module to access the dispatcher. Inculde it into classes that need
 * to send or receive messages. */
Core.Dispatchable = new Class({
  receivers: null,

  // Sends a message to the dispatcher
  send: function(msgId, data){
    Core.dispatcher.dispatch(msgId, data);
  },

  /* Called to receive a listened message. Return:
   * - true: to continue to deliver the message to all listeners, to all remaining priority queues.
   * - false: to deliver the message to this same priority queue, but skips lower priority queues.
   *
   * NOTE: It implements a simple facility to automate which method to call for a given msgId. Just
   *       use mapReceivers or mapListeners to store the proper receiver callback(data) for any msgId.
   *       You are obviously free to override it and use your custom receive.
   *       If using this facility, the receive return value is got directly from the return value
   *       of the receiver callback, so pay attention to its return value (true | false).
   **/
  receive: function(msgId, data){
    if(this.receivers == null) return true;
    return ( this.receivers[msgId](data) );
  },

  /* This helper method works like mapReceivers but also tells the dispatcher to listens messages.
   * Example:
   *  this.mapListeners([
   *    {map: 'msg1', to: callback1},
   *    {map: 'msg2', to: callback2, priority: 10},
   *    ...,
   *  ]);
   **/
  mapListeners: function(mapping){
    if(this.receivers == null){
      this.receivers = new Hash;
    }
    mapping.each(function(tie){
      this.receivers.set(tie.map, tie.to.bind(this));
      Core.dispatcher.listen({msg: tie.map, listener: this, p : tie.priority});
    }, this);
    return this;
  },

  /* Helper method that can be used to populate receviers. See comment on receive method.
   * Example:
   *  this.mapReceivers([
   *    {map: 'msg1', to: callback1},
   *    {map: 'msg2', to: callback2},
   *    ...,
   *  ]);
   **/
  mapReceivers: function(mapping){
    if(this.receivers == null){
      this.receivers = new Hash;
    }
    mapping.each(function(tie){
      this.receivers.set(tie.map, tie.to.bind(this));
    }, this);
    return this;
  },

  /* Tells the dispatcher I want to listen for a message
   * - msgId: a message id or an array of message ids to listen for
   * - priority: optional priority (greater => higher) appliced to all given message ids
   *
   * Examples:
   *    listen('msg1')
   *    listen('msg1', 20)
   *    listen(['msg1','msg2','msg3'], 10)
   **/
  listen: function(msgIds, priority){
    if($type(msgIds) == "array"){
      msgIds.each(function(msgId){
        Core.dispatcher.listen({msg: msgId, listener: this, p : priority});
      }, this);
    } else {
      Core.dispatcher.listen({msg: msgIds, listener: this, p : priority});
    }
    return this;
  },
  
  /* Unlistens one or more messages.
   * - msgIds: a message id or an array of message ids to unlisten
   * Examples:
   *    unlisten('msg1')
   *    unlisten(['msg1','msg2','msg3'])
   **/
  unlisten: function(msgIds){
    if($type(msgIds) == "array"){
      msgIds.each(function(msgId){
        Core.dispatcher.unlisten({msg: msgId, listener: this});
      }, this);
    } else {
      Core.dispatcher.unlisten({msg: msgIds, listener: this});
    }
    return this;
  },

  /* Unlistens all messages. */
  unlistenAll: function(){
    Core.dispatcher.remove(this);
    return this;
  }

});

/*********************************************************************/
/* Sniffer
 * The sniffer allows to listen for dispatched messages.
 * It listens with a default priority of 1000. Instanciate it using the $snif util.
 * Examples:
 * 
 *    1. snif = $snif(messageId)
 *    2. snif = $snif([messageId1, messageId2, ...])
 *    3. snif = $snif(messageId, myReceiver)
 *    4. snif = $snif([messageId1, messageId2, ...], myReceiver)
 *    5. snif.destroy()
 * 
 * Examples 1 and 2 show how you can snif for one or more messages at once.
 * Examples 3 and 4 show how you can pass your own receiver callback:
 * 
 *    myReceiver = function(message, data){...}
 *    
 * Your receive function has not to return true or false as the sniffer itself
 * always returns true so that dispatching can continue with lower priority
 * listeners.
 * Example 5 shows how to stop a sniffer, simply destroying it :)
 *
 * If you don't pass a callback the messages will be printed in the Konsole
 * in JSON format.
 *
 * GOOD PRACTICE: organize your messages like a hash. For example:
 *
 *  msg = {
 *    event: {
 *      click: 'click',
 *      mousemove: 'move',
 *      ...
 *    },
 *    action: {
 *      compute: 'doit',
 *      save: 'save',
 *      ...
 *    },
 *    custom: {
 *      my1: 1,
 *      my2: 2,
 *      ...
 *    }
 *  }
 *
 * so when sending or listening messages you can use a mnemonic:
 *
 *    - msg.event.click
 *    - msg.action.save
 *    - msg.custom.my2
 *
 * The actual message id is the value associated to the key, that can be a string
 * or a number. This is not only a good way to organize messages and to use them
 * in a natural way, but unleashen another sniffer functionality: message group sniffing.
 * Examples:
 *
 *    6. snif = $snif(msg.event)
 *    7. snif = $snif([msg.event, msg.custom])
 *    8. snif = $snif([msg.event.click, msg.action])
 *    9. snif = $snif(msg)
 *
 * as you can imagine, it allows to snif an entire group of messages, or any
 * combination of groups and message ids. Even if not shown in these examples
 * you can always attach a custom receiver like MyReceiver seen above.
 **/
Core.Dispatcher.Sniffer = new Class({
  Extends: Core.Base,
  Implements: Core.Dispatchable,
  name: "Sniffer",

  options: {
    priority: 1000
  },

  initialize: function(messages, myReceive){
    this.parent();
    this.customReceive = myReceive || null;
    this.pretty = false;
    this.messages = [];
    this.expand(messages);
    this.listen(this.messages, this.options.priority);
  },

  expand: function(messages){
    switch($type(messages)){
      case "object":
        $H(messages).each(function(message){
          this.expand(message);
        }, this);
        break;
      case "array":
        messages.each(function(message){
          this.expand(message);
        }, this);
        break;
      default:
        this.messages.push(messages);
        break;
    }
    return;
  },

  receive: function(msg, data){
    if(this.customReceive){
      this.customReceive(msg, data);
    } else {
      var msgDeco = this.msgDecorator(msg);
      this.pretty ?
        Konsole.info(msgDeco + "<pre style='font-size: 13px'>" + JSON.stringify(data, null, 1) + "</pre>", false) :
        Konsole.info(msgDeco + JSON.stringify(data, null, 1), false);
    }
    return true;
  },

  // Ovveride it in subclasses if you want to change message text indicator.
  msgDecorator: function(msg){
    return ("Msg[" + msg + "] => ");
  }
});
/* Returns a sniffer for one or more (array) of messages.
 * When you finish using it, destroy it. See Sniffer doc above. */
$snif = function(messages, myReceive){
  return (new Core.Dispatcher.Sniffer(messages, myReceive));
}