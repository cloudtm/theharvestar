Game.History = new Class.Singleton({
  Extends: Core.Base,
  name: 'History',

  initialize: function(){
    this.parent();
    this.timeline = [];
  },

  /* - data: is an object
   * - event: is an hash with:
   *   - type (string): event type
   *   - name (string): event name
   *   - any additonal params
   * The event will be save into to data object and enriched with a timestamp
   */
  push: function(data, event){
    if(typeof data != 'object' && typeof data != 'function'){
      data = {dataRaw: data, dataType: $type(data)}
    }
    if(!event){
      event = {time: new Date }
    } else {
      event.time = new Date;
    }
    data.event = event;
    this.timeline.push(data);
  },

  // return the filtered timeline
  // - last: N events
  // - first: N events
  // - type: event type
  // - name: event name
  filter: function(options){
    var
      data, limited,
      result = this.timeline,
      tlsize = this.timeline.length;

    if(options.type || options.name){
      var filteredTL = [];
      for(var i = 0; i <  tlsize; i++){
        data = this.timeline[i];
        if(accepted(data, options)){ filteredTL.push(data); }
      }
      result = filteredTL;
    }

    tlsize = result.length;
    if(options.last){
      limited = [];
      for(var i = Math.max(0, tlsize - options.last); i < tlsize; i++){
        data = result[i];
        if(accepted(data, options)){ limited.push(data); }
      }
      return limited;
    }
    if(options.first){
      limited = [];
      for(var i = 0; i <  Math.min(tlsize, options.first); i++){
        data = result[i];
        if(accepted(data, options)){ limited.push(data); }
      }
      return limited;
    }
    return result;

    function accepted(data, condition){
      if(condition.type && data.event.type != condition.type) { return false; }
      if(condition.name && data.event.name != condition.name) { return false; }
      return true;
    }
  }

});