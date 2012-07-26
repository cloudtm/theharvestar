/* Debugging extension for Gamecore library
 * © Algorithmica 2010
 * */

/*********************************************************************
 *                            DEBUGGING
 *********************************************************************/
// Debug messages are written inside a dialog.
Konsole.Panel =  new Class({
  Extends: Core.StaticActor,
  name: "Konsole",

  options: {
    classes: {
      panel: "madmass-konsole-panel",
      dialog: "madmass-konsole-dialog",
      content: "madmass-konsole-messages"
    },
    title: "Konsole",
    height: 200,
    width: 300
  },

  initialize: function(){
    this.parent();
    var panel = jQuery('<div>').addClass(this.options.classes.panel);

    this.content = jQuery('<div>').addClass(this.options.classes.content);

    panel.append(this.content);
    this.assign(panel);
  },

  afterAppend: function(){
    this.element.dialog({
      dialogClass: this.options.classes.dialog,
      width: this.options.width,
      height: this.options.height,
      title: this.options.title,
      close: function() {Konsole.enable(false);}
    });
    this.dialog = $('.' + this.options.classes.dialog);
    var clear = jQuery('<span class="clear-button">empty</span>');
    clear.click(this.clearContent.bind(this));

    $('.ui-dialog-titlebar', this.dialog).append(clear);
  },
  
  write: function(msg, type, escape){
    var stamp = '- ';
    if(Konsole.timestamp){
      var time = new Date;
      var hour = time.getHours() + "";
      var min = time.getMinutes() + "";
      var sec = time.getSeconds() + "";
      if(hour.length == 1) hour = "0" + hour;
      if(min.length == 1) min = "0" + min;
      if(sec.length == 1) sec = "0" + sec;
      stamp = '<span class="entry">' + hour + '.' + min + ':' + sec + '</span> ';
    }
    var message = (!$defined(escape) || escape) ? msg.escapeHTML() : msg;
    this.content.append('<div class="debug-message">' + stamp + "<span class='" + type + "'>" + message + '</span></div>');
    this.element.scrollTop(this.content.height());
  },

  clearContent: function(event){
    this.content.empty();
  }
});

