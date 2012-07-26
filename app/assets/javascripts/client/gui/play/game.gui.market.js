Game.Gui.Marketplace = new Class({
  Extends: Game.Gui.Item,
  name: "Marketplace",

  options: {
    template: 'marketplace',
    visibilityTrigger: 90   // percentage exposed of the market that triggers visibility
  },

  init: function(options){
    this.offers = []; // all the offers, mine and others
    this.popup = this.element.find('.popup');
    this.backToGame = this.element.find('.backtogame');
    this.attachBehaviors();
    this.mapListeners([
      {map: $msg.update.trade, to: this.openTrade},   // Opens my trade
      {map: $msg.update.offer, to: this.updateOffer}, // updates an offer or receives a new published offer
      {map: $msg.update.endTrade, to: this.endTrade}, // closes the trade
      {map: $msg.update.endOffer, to: this.endOffer}, // closes an offer
      // Listens these messages to manage button states:
      // -- counter offer
      {map: $msg.success.counterOffer, to: this.counterSuccess},
      {map: $msg.error.counterOffer, to: this.counterError},
      // -- accept offer
      {map: $msg.success.acceptOffer, to: this.acceptSuccess},
      {map: $msg.error.acceptOffer, to: this.acceptError},

      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Game.Gui.Marketplace: added.");
  },

  // Practically reloads market, as at the beginning of the game there are no offers
  start: function(game){
    var market = game.market;
    if(market.offers){
      market.offers.each(function(offer){
        this.updateOffer(offer);
      }, this);
    }
    if(market.trade_request){
      this.openTrade(market.trade_request);
    }
    $log("Loaded market.");
  },

  stop: function(){
    this.offers.each(function(offer){
      offer.destroy();
    });
    this.offers.empty();
    this.hidePopup();
    if(this.btnClose){
      this.btnClose.destroy();
      this.btnClose = null;
    }
    this.update();
  },

  /* Returns marketplace visibility data
  * - visible: number of visible pixels
  * - hidden: number of hidden pixels
  * - perc: percentage that is visible */
  visibility: function(){
    var jWin = $(window);
    var winTop = jWin.scrollTop();
    var winHeight = jWin.height();

    var marketTop = this.element.offset().top;
    var marketHeight = this.element.height();

    // pixels and perc could be both returned if necessary
    var pixels = Math.min(marketHeight, Math.max(0, winTop + winHeight - marketTop));
    var perc = (pixels / marketHeight * 100).round();
    var toScroll = marketHeight - pixels;
    return {visible: pixels, hidden: toScroll, perc: perc};
  },

  // true if marketplace is visible
  isVisible: function(){
    return (this.visibility().perc >= this.options.visibilityTrigger);
  },

  /*===================== Offers state control =========================*/

  // Response parameter contains the offer id, used in the offerFind function
  counterSuccess: function(response){
    var offer = this.offerFind(response);
    if(offer) offer.machine.event("success");
    return true;
  },

  // Response parameter contains the offer id, used in the offerFind function
  counterError: function(response){
    var offer = this.offerFind(response);
    if(offer) offer.machine.event("fail");
    return true;
  },

  // Response parameter contains the offer id, used in the offerFind function
  acceptSuccess: function(response){
    // Accept is followed by an end_trade so no state change is needed here
//    var offer = this.offerFind(response);
//    if(offer) offer.machine.event("success");
    return true;
  },

  // Response parameter contains the offer id, used in the offerFind function
  acceptError: function(response){
    var offer = this.offerFind(response);
    if(offer) offer.machine.event("fail");
    return true;
  },

  /*===================== Trade messages responders =========================*/
  // Open trade is called as a response to the update_trade server event
  openTrade: function(trade){
    trade.offers.each(function(offer){
      this.offerAdd(offer, '.offers.me');
    }, this);

    // Adds close trade for my offers
    this.btnClose = new Game.Gui.Button({
      anchor: {custom: 'close'},
      call: this.closeTrade.bind(this),
      template: 'none',
      enabled: true,
      text: false
    });
    this.appendChild(this.btnClose, '.section.me');
    return true;
  },

  /* Update offer is called as a response to the update_offer server event.
   * It is called as a result of 2 kind od actions:
   *
   * 1. new trade (place_trade_request action): update_offer is called for all
   *    players except the publisher. It is a new published trade so it must be
   *    added on the published section.
   * 2. counter_offer: update_offer is called for the publisher and the player
   *    that made the counter offer. In this case the offer must be updated for both.
   */
  updateOffer: function(offer){
    var published = this.offerFind(offer);
    published ? published.updateOffer(offer) : this.offerAdd(offer, '.offers.others');
    /* Notify that there is a new offer in the market if it is closed. Checking
     * for visibility prevents me from a self notification when doing a counter offer :) */
    if(!this.isVisible()){
      this.showPopup();
      this.send($msg.event.newMarketOffer);
    }
    return true;
  },

  endTrade: function(endedOffers){
    endedOffers.each(function(ended){
      this.offerRemove(ended);
    }, this);

    this.btnClose.destroy();
    this.btnClose = null;
    return true;
  },

  endOffer: function(endedOffer){
    this.offerRemove(endedOffer);
    return true;
  },

  /*===================== Offers operations =========================*/
  // All offer parameters are offer hashes

  // Searches the this.offers array for a given offer.
  // It return the MarketEntry if found.
  offerFind: function(offer){
    var found = null;
    this.offers.some(function(entry){
      if(entry.offer.id == offer.id){
        found = entry;
        return true;
      }
      return false;
    });
    return found;
  },

  /* Creates and returns a new offer entry for the given offer.
   * It is not added to the offers array but just created.
   * - publisher_id: is the id of the trade creator, who places the request.
   * - trader_id: is the id of the other traders who receive a request. */
  offerCreate: function(offer){
    /* Adds some info to the offer.
     * - myTrade is true if I started the trade.
     * - changed is true if the offer was edited. Used on market reload */
    offer.myTrade = (offer.publisher_id == GAME.pid);
    offer.changed = !(offer.created_at == offer.updated_at);

    var trader = offer.myTrade ? GAME.players[offer.trader_id] : GAME.players[offer.publisher_id];
    return new Game.Gui.MarketEntry({
      subs: {
        playerId: trader.slot,
        playerName: trader.name
      },
      offer: offer
    });
  },

  /* Adds a new offer to the panel.
   * - offer: offer hash
   * - where: panel css selector used in the appendChild
   **/
  offerAdd: function(offer, where){
    var newOffer = this.offerCreate(offer);
    this.offers.push(newOffer);
    this.appendChild(newOffer, where);
    this.update();
  },

  // Removes an offer from the panel
  offerRemove: function(offer){
    // Searches for the removed offer in the offers array
    var toRemove = this.offerFind(offer);
    if(toRemove){
      toRemove.destroy();
      this.offers.erase(toRemove);
      this.update();
    }
  },

  /*====================== Trade button calls =======================*/

  // Called by the exchange button as a user request to close the trade.
  closeTrade: function(){
    this.send($msg.rpc.closeTrade);
  },

  /*======================== Popup functions ========================*/
  showPopup: function(){
    if(this.popup.is(':visible')) return;
    this.popup.show()
      .animate({ opacity: 1 },{queue: false, duration: 250})
      .animate({ top: "+=40px" }, {easing: 'easeOutBounce', duration: 500});
    $send($msg.audio.fx, $fx.info.newOffer);
    return;

  },

  hidePopup: function(){
    if(!this.popup.is(':visible')) return;
    this.popup.hide();
    this.popup.css({opacity: 0, top: -130});
  },

  showMarket: function(){
    var winHeight = $(window).height();
    var marketTop = this.element.offset().top;
    var marketHeight = this.element.height();
    $('html, body').animate({scrollTop: marketTop + marketHeight - winHeight + 10}, 500);
    this.hidePopup();
  },

  showMap: function(){
    $('html, body').animate({scrollTop: 0}, 500);
  },

  checkVisibility: function(){
    if(!this.popup.is(':visible')) return;
    if(this.isVisible()) this.hidePopup();
  },

  /*======================== Other functions ========================*/
  attachBehaviors: function(){
    WORLD.element.on('mousedown.gui.market', this.closeSelectors.bind(this));
    $(window).on('scroll.gui.market', this.checkVisibility.bind(this));
    this.popup.on('mousedown.market.popup', function(){$send($msg.audio.fx, $fx.gui.buttonClick);})
    this.popup.on('click.market.popup', this.showMarket.bind(this));
    this.backToGame.on('mousedown.market.popup', function(){$send($msg.audio.fx, $fx.gui.buttonClick);})
    this.backToGame.on('click.market.popup', this.showMap.bind(this));
  },

  // updates the market dom. For now it only manages the no-trade visibility.
  update: function(){
    var myTrades = this.element.find('.offers.me .market-entry').length;
    var myNotrade = this.element.find('.offers.me .no-trade');
    var otherTrades = this.element.find('.offers.others .market-entry').length;
    var otherNotrade = this.element.find('.offers.others .no-trade');
    myTrades > 0 ? myNotrade.hide() : myNotrade.show();
    otherTrades > 0 ? otherNotrade.hide() : otherNotrade.show();
  },

  closeSelectors: function(){
    this.offers.each(function(offer){
      if(offer.selector.editable){
        offer.edit(false);
        offer.selector.revert();
      }
    });
  }

});
