/** User: marco * Date: 02/05/12 * Time: 17.53 **/
// Hiscores LIst
Game.Gui.HiscoresList = new Class({
  Extends: Game.Gui.Item,
  name: "HiscoresList",

  options: {
    template: 'hiscores-list',
    searchPlaceholder: 'Search User',
    placeholderClass: 'placeholder'
  },

  init: function(options){
    var self = this;
    this.entries = [];
    this.selection = {size: SETTINGS.read('hiscores.size'), page: 1};

    this.search = this.element.find('.search');
    this.searchUser = '';
    this.search.on({
      keyup: function(event){ if(event.keyCode == 13) self.doSearch(); },
      focus: function(){if(self.search.hasClass(self.options.placeholderClass)){self.placeholder(false);} },
      blur: function(){
        if(self.search.val() != self.searchUser){ self.search.val(self.searchUser); }
        if(self.search.val() == ''){ self.placeholder(true);}
      }
    });
    this.placeholder(true);

    // Prepare buttons -------------------------------------------------------------
    this.btnBack = new Game.Gui.Button({
      anchor: {custom: 'btn-back'}, template: 'none', text: "<div class='text'></div>",
      call: this.back.bind(this)
    });
    this.appendChild(this.btnBack, '.nav');

    this.btnMypos = new Game.Gui.Button({
      anchor: {custom: 'btn-mypos'}, template: 'none', text: "<div class='text'></div>",
      call: this.mypos.bind(this)
    });
    this.appendChild(this.btnMypos, '.nav');

    this.btnTop = new Game.Gui.Button({
      anchor: {custom: 'btn-top'}, template: 'none', text: "<div class='text'></div>",
      call: this.top.bind(this)
    });
    this.appendChild(this.btnTop, '.nav');

    this.btnPrev = new Game.Gui.Button({ anchor: {custom: 'btn-prev'}, template: 'none', text: '<< PREV', call: this.prev.bind(this) });
    this.appendChild(this.btnPrev, '.nav');

    this.btnNext = new Game.Gui.Button({ anchor: {custom: 'btn-next'}, template: 'none', text: 'NEXT >>', call: this.next.bind(this) });
    this.appendChild(this.btnNext, '.nav');

    // Listeners -------------------------------------------------------------
    this.mapListeners([
      {map: $msg.info.hiscoresStart, to: this.start},
      {map: $msg.info.hiscoresStop, to: this.stop},
      {map: $msg.update.hiscores, to: this.update}
    ]);
    $log("Game.Gui.HiscoresList: added.");
  },

  /**********************************************************************************/
  // BOARD ENTRY FUNCTONS
  start: function(scores){
    this.update(scores);
  },

  stop: function(){
    this.clean();
  },

  /**********************************************************************************/
  // BUTTONS
  back: function(){
    $send($msg.rpc.list);
  },

  mypos: function(){
    this.searchUser = '';
    this.search.val('');
    this.placeholder(true);
    $send($msg.rpc.hiscores, {
      size: SETTINGS.read('hiscores.size'),
      mypos: true
    });
  },

  top: function(){
    $send($msg.rpc.hiscores, {
      size: SETTINGS.read('hiscores.size'),
      page: 1,
      search: this.searchUser
    });
  },

  prev: function(){
    $send($msg.rpc.hiscores, {
      size: SETTINGS.read('hiscores.size'),
      page: Math.max(this.selection.page -1, 1),
      search: this.searchUser
    });
  },

  next: function(){
    $send($msg.rpc.hiscores, {
      size: SETTINGS.read('hiscores.size'),
      page: this.selection.page +1,
      search: this.searchUser
    });
  },

  doSearch: function(){
    var user = this.search.val();
    this.searchUser = user;
    this.top();
  },

  /**********************************************************************************/
  // LIST UPDATE
  update: function(scores){
    this.selection = scores.selection;
    var position = this.selection.size * (this.selection.page - 1);

    this.clean();
    // Creates the new entries
    var myEntry = null;
    scores.users.each(function(user){
      var power = Game.Helpers.userLevel(user.score);
      var entry = new Game.Gui.HiscoresEntry({
        user: user,
        subs: {
          level: power.level,
          toNext: power.range - power.progress || 1,  // HACK!! Controllare la funzione di level
          points: user.avg_score,
          pos: this.selection.filtered ? user.pos : ++position
        }
      })
      this.entries.push(entry);
      if(entry.me){ myEntry = entry.element; }
      this.appendChild(entry, '.scores');
    }, this);
    if(myEntry && this.selection.mypos) { Game.Helpers.showElement(myEntry); }
    this.adjustUi();
  },

  // Enables / Disables prev and next buttons
  adjustUi: function(){
    var first = this.selection.page == 1,
        last = this.selection.entries < this.selection.size;
    this.btnPrev.enable(!first);
    this.btnNext.enable(!last);
  },

  // Removes all score entries
  clean: function(){
    if(this.entries.length > 0){
      this.entries.each(function(entry){
        entry.destroy();
      });
      this.entries.empty();
    }
  },

  // Adds or removes the placeholder in the search input
  placeholder: function(active){
    if(active){
      this.search.addClass(this.options.placeholderClass).val(this.options.searchPlaceholder);
    } else {
      this.search.removeClass(this.options.placeholderClass).val('');
    }
  }


});