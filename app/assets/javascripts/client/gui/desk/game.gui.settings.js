/***************************************************************************/
// Settings dialog
Game.Gui.SettingsDialog = new Class({
  Extends: Game.Gui.Dialog,
  name: "SettingsDialog",

  options: {
    template: 'settings-dialog'
  },

  init: function(options){
    this.parent(options);

    /* Buttons ************************************************/
    this.btnOk = new Game.Gui.Button({
      anchor: {custom: 'ok'},
      call: this.close.bind(this),
      template: 'none',
      enabled: true,
      text: false
    });
    this.appendChild(this.btnOk);

    // Adds settings
    audioSettings.call(this);

    // Privates
    function audioSettings(){
      fx = {
        speaker: this.element.find('.fx .speaker'),
        slider: this.element.find('.fx .slider'),
        vol: this.element.find('.fx .vol')
      };
      music = {
        speaker: this.element.find('.music .speaker'),
        slider: this.element.find('.music .slider'),
        vol: this.element.find('.music .vol')
      };

      var volumes = SETTINGS.read('audio.volume');

      fx.slider.slider({
        value: volumes.fx,
        slide: function(event, ui){ adjust({ fx: ui.value, transient: true }); },
        stop: function(event, ui){ adjust({ fx: ui.value, transient: false }); }
      });

      music.slider.slider({
        value: volumes.music,
        slide: function(event, ui){ adjust({ music: ui.value, transient: true }); },
        stop: function(event, ui){ adjust({ music: ui.value, transient: false }); }
      });

      adjust.call(this, volumes);

      function adjust(volumes){
        if($defined(volumes.fx)){
          fx.vol.html(volumes.fx + '%');
          volumes.fx == 0 ? fx.speaker.addClass('mute') : fx.speaker.removeClass('mute');
          $send($msg.audio.mixer, {fxVolume: volumes.fx, transient: volumes.transient});
        }
        if($defined(volumes.music)){
          music.vol.html(volumes.music + '%');
          volumes.music == 0 ? music.speaker.addClass('mute') : music.speaker.removeClass('mute');
          $send($msg.audio.mixer, {musicVolume: volumes.music, transient: volumes.transient});
        }
      }
    }
  }
});