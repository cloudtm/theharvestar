/********************************************************************************
 *                             Market offer entry
 ********************************************************************************/
Game.Gui.MarketEntry = new Class({
  Extends: Game.Gui.Item,
  name: "MarketEntry",

  options: {
    template: 'market-entry',
    openSize: 26  // extension of the top and bottom paddings in edit mode
  },

  /* Market has alreasy setup 2 more variables:
   * - myTrade: boolean => is this offer a response to my request?
   * - changed: boolean => is the offer changed? Used to manage reload state. */
  init: function(options){
    this.offer = options.offer;
    this.switcher = options.offer.myTrade ? 1 : -1;
    this.state = null;  // used to add the css class to the entry
    
    this.selector = new Game.Gui.ResourceSelector({
      anchor: {custom: 'selector'},
      resources: this.mergeResources(options.offer.receive, options.offer.give),
      min: -10, max: 10,
      editable: false
    });
    this.observe(this.selector);
    this.appendChild(this.selector);

    // Ok button ---------------------------------------------
    this.btnOk = new Game.Gui.Button({
      anchor: {custom: 'ok'},
      call: this.acceptOffer.bind(this),
      template: 'none',
      enabled: true,
      text: false
    });
    this.appendChild(this.btnOk);

    // Builds the state machine
    var offerReloaded = GAME.loading && this.offer.changed;
    this.machine = new Core.FSM;
    this.machine
      .addState({name: '__start__'})  // instant initialization state: leads to edit or disabled states depending on data.myTrade variable.
      .addState({name: 'edit', enter: this.enterState.bind(this)})
      .addState({name: 'updated', enter: this.enterState.bind(this)})
      .addState({name: 'accepted', enter: this.enterState.bind(this)})
      .addState({name: 'disabled', enter: this.enterState.bind(this)})
      .addState({name: 'wait-ed', enter: this.enterState.bind(this)})
      .addState({name: 'wait-up', enter: this.enterState.bind(this)})

      .addTransition({from: '__start__', to: 'edit', allowed: !this.offer.myTrade})
      .addTransition({from: '__start__', to: 'disabled', allowed: this.offer.myTrade})
      .addTransition({from: 'edit', to: 'accepted', allowed: (offerReloaded && this.offer.trader_agrees)})
      .addTransition({from: 'edit', to: 'updated', allowed: (offerReloaded && this.offer.publisher_agrees)})
      .addTransition({from: 'disabled', to: 'accepted', allowed: (offerReloaded && this.offer.publisher_agrees)})
      .addTransition({from: 'disabled', to: 'updated', allowed: (offerReloaded && this.offer.trader_agrees)})
      
      .addTransition({from: 'disabled', to: 'updated', event: 'update'})
      .addTransition({from: 'edit', to: 'wait-ed', event: 'accept'})
      .addTransition({from: 'wait-ed', to: 'edit', event: 'fail'})
      .addTransition({from: 'wait-ed', to: 'accepted', event: 'success'})
      
      .addTransition({from: 'accepted', to: 'updated', event: 'update'})
      .addTransition({from: 'updated', to: 'wait-up', event: 'accept'})
      .addTransition({from: 'wait-up', to: 'updated', event: 'fail'})
      .addTransition({from: 'wait-up', to: 'accepted', event: 'success'});
    this.machine.start();
  },
  
  /* Notifications from selector:
   * up => {type: 'up', resource: res, count: num, sum: num, balanced: bool}
   * down => {type: 'down', resource: res, count: num, sum: num, balanced: bool}
   * tap => {type: 'tap'} clicked on the closed selector
   **/
  notify: function(obj, event){
    if(obj != this.selector) return;
    //this.btnOk.enable(event.sum != 0);
    // tap apre l'edit solo nello stato di: edit e updated'
    if(event.type == 'tap' && !this.selector.editable && ['edit', 'updated'].contains(this.machine.state)){
      this.edit();
    }
  },

  /* We manage for simplicity all entering states here, switching among them. */
  enterState: function(state){
    if(this.state) this.element.removeClass(this.state);
    switch(state){
      case 'edit':
        this.btnOk.enable(true);
        break;
      case 'updated':
        this.btnOk.enable(true);
        break;
      case 'accepted':
        this.selector.save();  // Resouce selection is the new snapshot.
      case 'wait-ed':
      case 'wait-up':
        this.btnOk.enable(false);
        break;
      case 'disabled':
        this.btnOk.enable(false);
        break;
    }
    this.state = state;
    this.element.addClass(this.state);
  },

  /* Updates the offer data and selectors. */
  updateOffer: function(offer){
    if(offer){
      this.offer = offer;
      this.machine.event('update');
    }
    // Updates selectors to match the offer data
    this.selector.setResources(this.mergeResources(this.offer.receive, this.offer.give));
    this.selector.save();  // Resouce selection is the new snapshot.
  },

  /* Accepts the offer or makes a counter offer. If no resource is changed in the offer then it's an accept,
   * if some resource is changed then it's a counter offer. */
  acceptOffer: function(){
    if(this.selector.editable) this.edit(false);
    // If we changed the offer, than we are doing a counteroffer.
    // If the offer is not changed, than we are accepting the trade.
    if(this.selector.isChanged()){
      // Updates the offer data to match selectors
      var resources = this.splitResources();
      this.offer.receive = resources.receive;
      this.offer.give = resources.give;
      
      this.send($msg.rpc.counterOffer, this.offer);
    } else {
      this.send($msg.rpc.acceptOffer, this.offer.id);
    }
    this.machine.event('accept');
  },
  
  edit: function(enabled){
    enabled = $defined(enabled) ? enabled : true;
    if(enabled){
      this.element.stop(true).animate({'padding-top': this.options.openSize, 'padding-bottom': this.options.openSize}, this.selector.options.changeSpeed);
      this.selector.edit();
    } else {
      this.element.stop(true).animate({'padding-top': 0, 'padding-bottom': 0}, this.selector.options.changeSpeed);      
      this.selector.edit(false);
    }
  },
  
  /* Returns a resource hash usable in the selector, where receive and give
   * are merged together using positive and negative notation.
   * Example:
   * - receive: {"silicon": 3, "titanium": 0, "energy": 0, "water": 0, "grain": 0}
   * - give:    {"silicon": 0, "titanium": 0, "energy": 3, "water": 0, "grain": 0}
   * becomes:
   *            {"silicon": 3, "titanium": 0, "energy": -3, "water": 0, "grain": 0}
   * Sign is controlled by this.switcher as receive and give are relative to the publisher. */
  mergeResources: function(receive, give){
    var resources = CONFIG.resourceSet();
    return resources.map(function(count, res){
      return (receive[res] - give[res]) * this.switcher;
    }, this);
  },
  
  // Do the opposite of mergeResources and returns {receive: {...}, give: {...}} taking into account switcher flag.
  splitResources: function(){
    var resources = {receive: {}, give: {}};
    this.selector.selection.each(function(count, res){
      var exchanged = count * this.switcher;
      if(exchanged >= 0){
        resources.receive[res] = exchanged;
        resources.give[res] = 0;
      } else {
        resources.receive[res] = 0;
        resources.give[res] = -exchanged; 
      }
    }, this);
    return resources;
  }

});