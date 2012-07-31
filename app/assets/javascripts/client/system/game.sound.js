/***************************************************************************
                                Sounds Resources
***************************************************************************/

/* NOTE: sound options are SoundManager2 SMSound object properties, for a full list:
 *       http://www.schillmania.com/projects/soundmanager2/doc/#sound-object-properties */
Game.Sounds = {}
// Fx are one shot audio samples
Game.Sounds.Fx = {
  gui:{
    buttonClick: {url: "/assets/fx/gui/click.mp3", volume: 70, autoLoad: true},
    link: {url: "/assets/fx/link.mp3", volume: 60, autoLoad: true},
    outpost: {url: "/assets/fx/outpost.mp3", volume: 90, autoLoad: true},
    station: {url: "/assets/fx/station.mp3", volume: 35, autoLoad: true},
    select : {url: "/assets/fx/gui/select.mp3", volume: 35, autoLoad: true},
    recycle : {url: "/assets/fx/gui/recycle.mp3", volume: 60, autoLoad: true}
  },
  map:{
    field: {url: "/assets/fx/map/frutta.mp3", volume: 50, autoLoad: true},
    lake: {url: "/assets/fx/map/goccia.mp3", volume: 100, autoLoad: true},
    cyclon: {url: "/assets/fx/map/lava.mp3", volume: 100, autoLoad: true},
    volcano: {url: "/assets/fx/map/silicio.mp3", volume: 50, autoLoad: true},
    mountain: {url: "/assets/fx/map/titanio.mp3", volume: 70, autoLoad: true},
    raidersMove: {url: "/assets/fx/map/pirates.mp3", volume: 100, autoLoad: true}
  },
  chat:{
    newMessage: {url: "/assets/fx/gui/chat_beep.mp3", volume: 60, autoLoad: true}
  },
  info:{
    newOffer: {url: "/assets/fx/trade_offer.mp3", volume: 60, autoLoad: true},
    robber:{url: "/assets/fx/robber.mp3", volume: 100, autoLoad: true},
    scoreUp:{url: "/assets/fx/point_gain.mp3", volume: 50, autoLoad: true},
    scoreDown:{url: "/assets/fx/point_lose.mp3", volume: 100, autoLoad: true},
    win:{url: "/assets/fx/win.mp3", volume: 80, autoLoad: true}
  },
  popup:{
    alert: {url: "/assets/fx/error.mp3", volume: 100, autoLoad: true},
    info: {url: "/assets/fx/error.mp3", volume: 100, autoLoad: true},
    tip: {url: "/assets/fx/beep3.mp3 ", volume: 100, autoLoad: true},
    market: {url: "/assets/fx/coins.mp3", volume: 100, autoLoad: true},
  },
  income:{
    low: {url: "/assets/fx/coin.mp3", volume: 100, autoLoad: true},
    high: {url: "/assets/fx/coins.mp3", volume: 100, autoLoad: true}
  }
};
// Music should define one or more playlists. To be defined...
Game.Sounds.Music = {
  play: {url: "/assets/music/ambience1b.mp3", volume: 100, autoLoad: true, autoPlay: true, stream: true},
  hiscores: {url: "/assets/music/titleA_2b_orch.mp3", volume: 100, autoLoad: true, autoPlay: true, stream: true},
  list: {url: "/assets/music/titleA_4.mp3", volume: 100, autoLoad: true, autoPlay: true, stream: true}
}

$fx = Game.Sounds.Fx;
$music = Game.Sounds.Music;

/***************************************************************************
                               Sounds System
***************************************************************************/

Game.SoundSystem = new Class.Singleton({
  Extends: Core.Base,
  Implements: Core.Dispatchable,
  name: "SoundSystem",

  options:{
    fxDefaults:{
      volume: 100
    }
  },

  initialize: function(){
    $log("Game.SoundSystem: initializing...", {section: 'open'});

    var volumes = SETTINGS.read('audio.volume');
    this.fxVolume = volumes.fx;               // range 0..100 where 0 is mute
    this.musicVolume = volumes.music;         // range 0..100 where 0 is mute
    this.fxMix = this.fxVolume / 100;         // fxVolume / 100
    this.musicMix = this.musicVolume / 100;   // musicVolume / 100

    this.audioId = -1;      // current free soundId
    this.currentMusic = null; // current played music

    /* Sound collectore traverse the above Game.Sounds hash and build an array
     * of sounds assigning them an unique id. This allows the complete freedom
     * in the definition of the Game.Sounds structure. */
    var SoundCollector = function(){
      this.audioId = 1;
      this.sounds = [];
      this.traverse = function(hash, assignId){
        if(!hash) return;
        for(var key in hash){
          var node = hash[key];
          if($defined(node.url)){
            if(assignId) {node.id = 'snd' + this.audioId++; }
            node.volume = node.volume || this.options.fxDefaults.volume;
            this.sounds.push(node);
          } else {
            this.traverse(node, assignId);
          }
        }
        return;
      };
    };
    
    var sc = new SoundCollector();
    // Traverses the fx sounds assigning unique ids
    sc.traverse($fx, true);
    this.effects = sc.sounds;    // << sounds is the array of fx sounds
    this.audioId = sc.audioId;  // saves the current audio ID for later use (music loading)

    // Traverses the music sounds without assigning ids
    sc.sounds = [];
    sc.traverse($music, false);
    this.musics = sc.sounds;    // << musics is the array of fx musics

    /* Preloads all the fx sounds */
    soundManager.onready(function(){
      this.effects.each(function(effect){
        effect.sound = soundManager.createSound(effect);
        $log("Added sound: " + effect.url);
      });
    }, this);

    this.mapListeners([
      {map: $msg.audio.fx, to: this.playFx},
      {map: $msg.audio.music, to: this.playMusic},
      {map: $msg.audio.mixer, to: this.mixer},
      {map: $msg.audio.mute, to: this.mute}
    ]);
    $log("Game.SoundSystem: OK", {section: 'close'});
  },

  /* Receives SMSound parameters (fx leaf node)
   * NOTE: All fx sounds are preloaded in the initialization. */
  playFx: function(fx){
    if(!(fx && fx.id) || this.fxVolume <= 0) return true;
    var sound = soundManager.getSoundById(fx.id);
    if(sound) sound.play({volume: fx.volume * this.fxMix});
    return true;
  },

  /* Receives SMSound parameters (music leaf node)
   * NOTE: The music files are lazy loaded (when required). */
  playMusic: function(music){    
    if(!music) return true;
    var self = this;
    
    if(this.currentMusic){
      // If we want to play the same music currently playing, ignore the request:
      if(music.id == this.currentMusic.source.id && this.currentMusic.playState == 1){ return; }
      this.currentMusic.stop();
    }
    
    if(music.id){
      var sound = soundManager.getSoundById(music.id);
      if(sound){
        $log("Playing music: " + JSON.stringify(music));
        this.currentMusic = sound;
        this.currentMusic.source = music;
        if(this.musicMix > 0){ loopMusic(); }
        this.currentMusic.setVolume(music.volume * this.musicMix);
      }
    } else {
      soundManager.onready(function(){
        music.id = "snd" + this.audioId++;
        music.onfinish = loopMusic;
        $log("Loading and playing music: " + JSON.stringify(music));
        if(this.musicMix <= 0){ music.autoPlay = false; }
        this.currentMusic = soundManager.createSound(music);
        this.currentMusic.source = music;
        this.currentMusic.setVolume(music.volume * this.musicMix);
      }, this);
    }
    return true;

    function loopMusic() {
      self.currentMusic.play({
        onfinish: loopMusic
      });
    }
  },

  // params:
  // - fxVolume: [0..100]
  // - musicVolume: [0..100]
  // - transient: [true|false], default false. If true, volumes are not saved in the settings.
  mixer: function(params){
    if($defined(params.fxVolume)){
      this.fxVolume = Math.max(0, Math.min(100, params.fxVolume));
      if(!params.transient) SETTINGS.write('audio.volume.fx', this.fxVolume);
      this.fxMix = this.fxVolume / 100;
      // Adjust volume of playing effects
      this.effects.each(function(effect){
        if(effect.sound.playState == 1){
          effect.sound.setVolume(effect.volume * this.fxMix);
        }
      }, this);
    }
    if($defined(params.musicVolume)){
      this.musicVolume = Math.max(0, Math.min(100, params.musicVolume));
      if(!params.transient) SETTINGS.write('audio.volume.music', this.musicVolume);
      this.musicMix = this.musicVolume / 100;
      if(this.currentMusic){
        this.musicMix <= 0 ? this.currentMusic.pause() : (this.currentMusic.playState ? this.currentMusic.resume() : this.currentMusic.play());
        this.currentMusic.setVolume(this.currentMusic.source.volume * this.musicMix);
      }
    }
    return true;
  },

  // Applies a temporary mute to both music and effects. Unmuting reverts original music and effect volumes.
  mute: function(muted){
    if(muted){
      this.mixer({fxVolume: 0, musicVolume: 0, transient: true});
    } else {
      var volumes = SETTINGS.read('audio.volume');
      this.mixer({fxVolume: volumes.fx, musicVolume: volumes.music, transient: true});
    }
  }

});