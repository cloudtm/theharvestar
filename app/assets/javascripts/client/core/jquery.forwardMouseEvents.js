/* jQuery object oriented plugin */
Core.MouseEventsForwarder = new Class({
  Implements: Options,

  options: {
    debug: false,
    enableMousemove: false,
    dblClickThreshold: 500,
    enabled: true
  },

  jQuery: 'forwardMouseEvents', // must be after options definition

  initialize: function(selector, options){
    /****************************************************************/
    this.setOptions(options);
    this.jElems = jQuery(selector);
    if(this.jElems.length == 0){
      $log("forwardMouseEvents: no elements found!", {level: 'error'});
      return;
    }

    /* Variables shared by the instance (contextually bounded
     * to the event handlers where they continue to live). */
    var instance = this,
      debug = this.options.debug,
      lastTarget,
      clickX, clickY,
      clicks = 0,
      lastClick = 0;

    var trigger = function(target, eventType){
      if(debug) $log("Forwarding: " + eventType);
      target.trigger(eventType);
    };

    this.lastElem = null; // last forwarded element, used for cursor css reset.
    this.jElems
    .on('mouseout', function (event) {
      if(lastTarget) {
        trigger(lastTarget, 'mouseout');
        if(debug) lastTarget.css('outline', 'none');
        lastTarget = null;
      }
    })
    .on('mousemove mousedown mouseup mousewheel', function (event) {
      var jElem = $(this);
      if(instance.options.enabled && jElem.is(':visible')) {
        var
          org = event.originalEvent,
          eventType = org.type,
          cx = org.clientX,
          cy = org.clientY,
          newTarget;

        event.stopPropagation();


        // Finds the target behind this object
        jElem.hide();
        newTarget = $(document.elementFromPoint(cx, cy));
        jElem.show();

        // Should never happen?
        if(!newTarget) {
          jElem.css('cursor', 'auto');
          trigger(lastTarget, 'mouseout');
          if(debug) lastTarget.css('outline', 'none');
          lastTarget = newTarget;
          return;
        }

        if(debug){
          if(lastTarget) lastTarget.css('outline', 'none');
          newTarget.css('outline', '2px solid red');
        }

        // Adjust cursor style
        instance.lastElem = jElem;
        jElem.css('cursor', newTarget.css('cursor'));

        // If enableMousemove then triggers any event, otherwise only !mousemove
        if(instance.options.enableMousemove || eventType !== 'mousemove') {
          trigger(newTarget, eventType);
        }

        /* If a musup occurred on the same element, manges manually click and double click.
         * Note: .get(index) retrieves the original element */
        if(lastTarget && (newTarget.get(0) === lastTarget.get(0))) {
          if(eventType == 'mouseup') {

            // using document.elementFromPoint in mouseup doesn't trigger dblclick event on the overlay
            // hence we have to manually check for dblclick
            if(clickX != cx || clickY != cy || (event.timeStamp - lastClick) > instance.options.dblClickThreshold) {
              clicks = 0;
            }

            clickX = cx;
            clickY = cy;
            lastClick = event.timeStamp;
            trigger(newTarget, 'click');

            if(++clicks == 2) {
              trigger(newTarget, 'dblclick');
              clicks = 0;
            }
          }
        } else {
          clicks = 0;
          if(lastTarget) {
            trigger(lastTarget, 'mouseout');
          }
          trigger(newTarget, 'mouseover');
        }

        lastTarget = newTarget;
      }
    });
  },

  enable: function(enabled){
    enabled = $defined(enabled) ? enabled : true;
    this.options.enabled = enabled;
    if(!enabled && this.lastElem) this.lastElem.css('cursor', 'auto');
  },

  isEnabled: function(){
    return this.options.enabled;
  }

});