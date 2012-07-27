// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
// WARNING: THE FIRST BLANK LINE MARKS THE END OF WHAT'S TO BE PROCESSED, ANY BLANK LINE SHOULD
// GO AFTER THE REQUIRES BELOW.
//
//= require jquery
//= require jquery_ujs
//= require lib
//= require client
//= require_self

function initialize(sensingPercept){
    /* SoundManager initialization. Must be here, that is before either
   * onDOMContentLoaded() or window.onload() fire. */
  soundManager.url = '/swfs/';
  soundManager.flashVersion = 9; // optional: shiny features (default = 8)
  soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
  //soundManager.useHTML5Audio = true;

  // Adds placeholder to the jQuery support variables
  jQuery.support.placeholder = false;
  var phTest = document.createElement('input');
  if('placeholder' in phTest){ jQuery.support.placeholder = true; }

  /* Starts the game after the page loads.
   * When the page has finished loading calls the main function.
   * It cannot be done with body onload because it's overwritten by
   * the layout body */
  jQuery(document).ready(function() {
    $("#loadInfo").show();
    var loaded = false;

    // Image preloader
    $.preloadCssImages({
        statusTextEl:'#textStatus',
        statusBarEl:'#status',
        onComplete:function() { //Do this when pre-loading finished
          if(!loaded){
            loaded = true;
            $("#loadInfo").remove();
            //loadFonts();
            startGame();
          }
        }}
    );

    // Load fonts (has to be done after image preloading)
    function loadFonts(){
      WebFont.load({
        custom: {
          families: ['HelveticaNeueBI:i,bi'],
          urls: ['/stylesheets/client/fonts.css']
        },
//        fontactive: function(fontFamily, fontDescription) {
//          console.info("Loaded: " + fontFamily + ' => ' + fontDescription);
//        },
        active: function() {
          startGame();
        }
      });
    }

    function startGame(){
      Game.initialize(sensingPercept);
    }
  });

}