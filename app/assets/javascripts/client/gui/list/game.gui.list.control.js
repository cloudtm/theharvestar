/***************************************************************************
               Game Control Panel (sounds mixer, quitting...)
***************************************************************************/

// By now it just wraps the give up buttone. Make different classes when it evolves.
Game.Gui.ListControlPanel = new Class({
  Extends: Game.Gui.Item,
  name: "ListControlPanel",

  options:{
    template: 'none'
  },
  
  init: function(options){

    // Algorithmica logo
//    this.element.append($("<div class='algorithmica'></div>"));
    // The harvestar logo
    this.element.append($("<div class='harvestar'></div>"));

    this.btnDemo = new Game.Gui.Button({
      anchor: {custom: 'btn-demo'}, template: 'none', text: "<div class='text'></div>",
      call: this.startDemo.bind(this)
    });
    this.appendChild(this.btnDemo);

    this.btnHiscores = new Game.Gui.Button({
      anchor: {custom: 'btn-hiscores'}, template: 'none', text: "<div class='text'></div>",
      call: this.hiscores.bind(this)
    });
    this.appendChild(this.btnHiscores);

    this.btnCreate = new Game.Gui.Button({
      anchor: {custom: 'btn-create'}, template: 'none', text: "<div class='text'></div>",
      call: this.createGame.bind(this)
    });
    this.appendChild(this.btnCreate);

    this.mapListeners([
      {map: $msg.info.newState, to: adjustUi}
    ]);

    $log("Game.Gui.ListControlPanel: added.");

    // Adjust buttons enalbed disabled state
    function adjustUi(state){
      switch(state){
        case 'list':
          this.btnDemo.enable(true);
          this.btnCreate.enable(true);
          this.btnHiscores.enable(true);
          break;
        case 'join':
          this.btnDemo.enable(false);
          this.btnCreate.enable(false);
          this.btnHiscores.enable(false);
          break;
      }
    }
  },

  startDemo: function(){
    $send($msg.rpc.demoGame);
  },

  createGame: function(){
    $send($msg.rpc.createGame);
  },

  hiscores: function(){
    $send($msg.rpc.hiscores, {size: SETTINGS.read('hiscores.size'), page: 1});
  },

  account: function(){
    $send($msg.rpc.account);
  }

});
