/***************************************************************************/
// Market Trade dialog
Game.Gui.MarketDialog = new Class({
  Extends: Game.Gui.Dialog,
  name: "MarketDialog",

  options: {
    template: 'market-dialog',
    defaultRequest: 1          // how many resources request by default
  },

  init: function(options){
    this.parent(options);
    
    var request = {};
    request[options.resource] = this.options.defaultRequest;
    this.selector = new Game.Gui.ResourceSelector({
      x: 54, y: 128,
      resources: request,
      min: -10, max: 10
    });
    this.appendChild(this.selector);
    this.observe(this.selector);
    
    /* Buttons ************************************************/
    this.btnOk = new Game.Gui.Button({
      anchor: {custom: 'ok'},
      call: this.trade.bind(this),
      template: 'none',
      enabled: true,
      text: false
    });
    this.appendChild(this.btnOk);
    this.appendChild(new Game.Gui.Button({
      anchor: {custom: 'cancel'},
      call: this.close.bind(this),
      template: 'none',
      enabled: true,
      text: false
    }));
  },
  
  /* Notifications from selector:
   * up => {type: 'up', resource: res, count: num, sum: num, balanced: bool}
   * down => {type: 'down', resource: res, count: num, sum: num, balanced: bool}
   * tap => {type: 'tap'} [NOT INTERESTING]
   **/
  notify: function(obj, event){
    if(obj != this.selector || event.type == "tap") return;
    this.btnOk.enable(event.any);
  },
  
  trade: function(){
    var resources = this.splitResources();
    $send($msg.rpc.openTrade, {r: resources.receive, g: resources.give});
    this.close();
  },
  
  /* Do the opposite of mergeResources and returns {receive: {...}, give: {...}} taking into account switcher flag.
   * NOTE: This function si a duplicate => see market entry. Place it in a shared place. */
  splitResources: function(){
    var resources = {receive: {}, give: {}};
    this.selector.selection.each(function(count, res){
      if(count >= 0){
        resources.receive[res] = count;
        resources.give[res] = 0;
      } else {
        resources.receive[res] = 0;
        resources.give[res] = -count; 
      }
    }, this);
    return resources;
  }
  
});
 