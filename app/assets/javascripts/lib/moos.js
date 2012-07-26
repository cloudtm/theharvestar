/* This mootools-jQuery plugin converts a
 *    <div clas='myclass' rel='57' />
 *
 * into star ranking. JQuery usage:
 *    $('.myclass').stars();
 *
 * Mootools usage:
 *    myStars = new Stars('.myclass');
 *
 * Parameters:
 * - size: number of stars
 * - style: class style to apply to the starred div (default 'starred')
 * - speed: speed of the animation effect.
 *
 * Example:
 *    $('.myclass').stars({size: 10, speed: 5000});
 *
 * After the stars are applied, you can animate the star bar with the rate method.
 * Example:
 *    $('.myclass').stars('rate', 70);
 *
 * animates the stars to 70%, or mootools version:
 *    myStars.rate(70);
 **/
var Stars = new Class({

  Implements: Options,

  options: {
    size: 5,
    width: 25,
    height: 25,
    style: 'starred',
    speed: 2000,
    img: '/images/stars.png'
  },

  jQuery: 'stars', // must be after options definition
  stars: [],

  initialize: function(selector, options){
    var convert2Stars = function(index, object){
      var parseRating = function(rating){
        if(rating.length == 0) rating = '0';
        return(parseInt(rating));
      };

      var jObject = jQuery(object);
      if(!jObject.hasClass(this.options.style)){
        this.rating = this.trim( parseRating(jObject.attr('rel')) );
        jObject.addClass(this.options.style);
        jObject.css({
          background: "url('" + this.options.img + "') 0 0 repeat-x",
          width: (this.options.width * this.options.size) + 'px',
          height: this.options.height + 'px'
        });
        var stars = jQuery('<div>', {
          css: {
            background: "url('" + this.options.img + "') 0 -" + this.options.height + "px repeat-x",
            width: this.rating + '%',
            height: this.options.height + 'px'
          }
        });
        jObject.append(stars);
        this.stars.push(stars);
      }
    };

    //  = START HERE =  //
    this.setOptions(options);
    this.jqueryObject = jQuery(selector);

    if(this.jqueryObject.length == 0) return;

    this.jqueryObject.each(convert2Stars.bind(this));
  },

  rate: function(newRating){
    var normalRate = this.trim(newRating);
    this.stars.each(function(star){
      star.attr('rel', normalRate);
      star.animate({width: normalRate + '%'}, this.options.speed);
    }, this)
  },

  trim: function(rating){
    return Math.min(100, Math.max(0, rating));
  }
});

/* Animated horizontal progress bar. Like stars plugin but with a single image (no repetitions). */
var Battery = new Class({

  Implements: Options,

  options: {
    width: 155,
    height: 42,
    style: 'energized',
    speed: 500,
    img: '/images/battery.png'
  },

  jQuery: 'battery', // must be after options definition
  batteries: [],

  initialize: function(selector, options){
    var convert2Batteries = function(index, object){
      var parseEnergy = function(energy){
        if(energy.length == 0) energy = '0';
        return(parseInt(energy));
      };

      var jObject = jQuery(object);
      if(!jObject.hasClass(this.options.style)){
        this.energy = this.trim( parseEnergy(jObject.attr('rel')) );
        jObject.addClass(this.options.style);
        jObject.css({
          background: "url('" + this.options.img + "') 0 0 no-repeat",
          width: this.options.width + 'px',
          height: this.options.height + 'px'
        });
        var charge = jQuery('<div>', {
          css: {
            background: "url('" + this.options.img + "') 0 -" + this.options.height + "px repeat-x",
            width: this.energy + '%',
            height: this.options.height + 'px'
          }
        });
        jObject.append(charge);
        this.batteries.push(charge);
      }
    };

    //  = START HERE =  //
    this.setOptions(options);
    this.jqueryObject = jQuery(selector);

    if(this.jqueryObject.length == 0) return;

    this.jqueryObject.each(convert2Batteries.bind(this));
  },

  charge: function(newEnergy){
    var trimmedEnergy = this.trim(newEnergy);
    this.batteries.each(function(battery){
      battery.attr('rel', trimmedEnergy);
      battery.animate({width: trimmedEnergy + '%'}, this.options.speed);
    }, this)
  },

  trim: function(fill){
    return Math.min(100, Math.max(0, fill));
  }

});

var Rotor = new Class({

  Implements: Options,

  options: {
    width: 41,
    height: 41,
    frameWidth: 45,
    frameHeight: 45,
    states: 4, // addressed from 0 to N-1
    style: 'rotated',
    speed: 1000,
    img: '/images/rotor.png'
  },

  jQuery: 'rotor', // must be after options definition
  rotors: [],

  initialize: function(selector, options){
    var convert2Rotors = function(index, object){
      var parseState = function(state){
        if(state.length == 0) state = '0';
        return(parseInt(state));
      };

      var jObject = jQuery(object);
      if(!jObject.hasClass(this.options.style)){
        var state = this.trim( parseState(jObject.attr('rel')) );
        jObject.addClass(this.options.style);
        jObject.css({
          width: this.options.frameWidth + 'px',
          height: this.options.frameHeight + 'px'
        });

        var rotorXoffset = (this.options.frameWidth - this.options.width) / 2;
        var rotorYoffset = (this.options.frameHeight - this.options.height) / 2;
        var rotor = jQuery('<div>', {
          css: {
            position: 'absolute',
            left: rotorXoffset + 'px',
            top: rotorYoffset + 'px',
            background: "url('" + this.options.img + "') no-repeat",
            'background-position': "0 -" + (this.options.frameHeight + this.options.height * state) + "px",
            width: this.options.width + 'px',
            height: this.options.height + 'px'
          }
        });
        var frame = jQuery('<div>', {
          css: {
            position: 'absolute',
            left: 0,
            top: 0,
            background: "url('" + this.options.img + "') no-repeat",
            width: this.options.frameWidth + 'px',
            height: this.options.frameHeight + 'px'
          }
        });
        jObject.append(rotor).append(frame);
        this.rotors.push(rotor);
      }
    };

    //  = START HERE =  //
    this.setOptions(options);
    this.jqueryObject = jQuery(selector);

    if(this.jqueryObject.length == 0) return;

    this.jqueryObject.each(convert2Rotors.bind(this));
  },

  rotate: function(newState){
    var trimmedState = this.trim(newState);
    this.rotors.each(function(rotor){
      rotor.attr('rel', trimmedState);
      rotor.animate({'backgroundPosition': '0px -' + (this.options.frameHeight + this.options.height * newState) + 'px'}, this.options.speed, 'easeOutBounce')
    }, this)
  },

  trim: function(state){
    return Math.min(this.options.states - 1, Math.max(0, state));
  }

});