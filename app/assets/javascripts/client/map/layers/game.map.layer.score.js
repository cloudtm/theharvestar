/********************************************************************************/
/* Score display gui item. */
Game.Map.Score = new Class({
  Extends: Core.StaticActor,
  Implements: [Core.Dispatchable, Core.Templatable],
  name: "Score",

  options: {
    template: 'score-template',
    stepSpeed: 250         // score bar fill speed
  },

  anchor: {custom: 'game-score'},

  initialize: function(options){
    this.parent();
    this.templetize(this.options.template);
    this.score = 0;
    this.stepSize = Math.floor(CONFIG.fps * this.options.stepSpeed / 1000);
    this.steppyTime = this.options.stepSpeed / this.stepSize;
    this.scoreBoard = [];
    ['.s1','.s2','.s3','.s4','.s5','.s6','.s7','.s8','.s9','.s10'].each(function(s){
      this.scoreBoard.push(this.element.find(s));
    }, this);
    this.mapListeners([
      {map: $msg.info.score, to: this.showScore},
      {map: $msg.info.playStart, to: this.start},
      {map: $msg.info.playStop, to: this.stop}
    ]);
    $log("Game.Map.Score: added.");
  },

  start: function(){
    this.showScore(GAME.totalScore);
  },

  stop: function(){
    this.showScore(0);
  },

  showScore: function(score){
    var newScore = Math.max(0, Math.min(score, 10));
    if(this.score == newScore) return true;

    // Audio effects (only at runtime)
    if(!(GAME.loading || GAME.resetting)){
      if(newScore > this.score){
        newScore == 10 ? $send($msg.audio.fx, $fx.info.win) : $send($msg.audio.fx, $fx.info.scoreUp);
      } else {
        $send($msg.audio.fx, $fx.info.scoreDown);
      }
    }

    // Updates the score
    this.score = newScore;
    this.scoreBoard.each(function(s, i){
      i < score ? s.show() : s.hide();
    });

    return true;

    // Tentativo di rendere l'avanzamento animato. Da ricontrollare...
    newScore = Math.max(0, Math.min(score, 10)) * this.stepSize;
    if(this.score == newScore) return true;

    this.startScore = this.score;
    this.time = 0;
    this.deltaScore = newScore - this.score;

    this.duration = Math.abs(this.deltaScore * this.steppyTime);
    this.transition = new Core.Transitions;
    this.transition.add('fadeIn', {ease: 'OutSine', duration: this.duration});

    this.animate();
    return true;
  },

  /* Note: extend a DynamicActor to use the tick function. */
  tick: function(delta){
    this.time += delta;
    this.score = this.startScore + Math.round(this.transition.swing(this.time).fadeIn * this.deltaScore);
    this.render();
    if(this.time >= this.duration){
      return false;
    }
    return true;
  },

  render: function(){
    var opacity = ((this.score % this.stepSize) / this.stepSize).toFixed(2);
    var opBar = Math.floor(this.score / this.stepSize);
    //Konsole.info("onBars: " + onBars + ", faded bar: " + i + ", opacity: " + opacity);
    this.scoreBoard[opBar].css('opacity', opacity);
  }

});
