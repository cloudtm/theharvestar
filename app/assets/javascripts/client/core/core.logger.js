/*********************************************************************
 *                             LOGGER
 *********************************************************************/
Core.Logger = new Class.Singleton({
  Extends: Core.Base,
  name: "Logger",

  options: {
    indentString: '. '
  },

  initialize: function(){
    this.parent();
    this.log('Logger active.');
    this.sectionLevel = 0;
  },

  /* options:
   * - time: [true | false] include or not timestamp
   * - level: ['info' | 'warn' | 'error'] log level
   * - section: ['open' | 'close'] when a section is open, subsequesnt logs are indented by sectioning level.
   *   */
  log: function(msg, options){
    if($type(msg) == "object"){
      options = msg;
      msg = false;
    }
    options = options || {};
    options = $H(options).combine({time: true, level: 'info'});
    var indentDepth = this.sectionLevel;
    switch(options.section){
      case 'open':
        this.sectionLevel++;
        break;
      case 'close':
        this.sectionLevel = Math.max(0, this.sectionLevel - 1);
        indentDepth = this.sectionLevel;
        break;
    }
    if(!msg) return;

    var out = '';
    if(!Konsole.timestamp && options.time){
      var time = new Date;
      var hour = time.getHours() + "";
      var min = time.getMinutes() + "";
      var sec = time.getSeconds() + "";
      if(hour.length == 1) hour = "0" + hour;
      if(min.length == 1) min = "0" + min;
      if(sec.length == 1) sec = "0" + sec;
      out += '[' + hour + '.' + min + ':' + sec + ']';
    }
    if( !(typeof Konsole[options.level] === 'function' ) ){
      options.level = 'info';
    }
    out += msg;
    var indent='';
    while(indent.length < (indentDepth * this.options.indentString.length)) indent += this.options.indentString;
    Konsole[options.level](indent + out);
  }
});
