$(document).ready(function() {
  // Wait for the document to become ready
  $("a[data-popup]").live('click', function(e) {
    window.open($(this)[0].href);
    // Prevent the link from actually being followed
    e.preventDefault();
  });
});

function showPopUp(content_id) {
  if(content_id == '') return;
  $('#' + content_id).siblings('div').each(function(index, elem) {
    $(elem).hide();
  });

  // manage back behaviour
  if(content_id == "session-form") {
    $('.back-popup-button').hide();
  } else if((content_id == "password-form") || (content_id == "password-edit") || (content_id == "registration-form")) {
    showBack("session-form");
  } else if((content_id == "privacy-content") || (content_id == "terms-content")) {
    showBack("registration-form");
    //switchBack("registration-form");
  }

  if((content_id == "session-form") || (content_id == "password-form") || (content_id == "password-edit") || (content_id == "registration-form")) {
    $(".big-pop-up-window").hide();
    $(".pop-up-window").show();
  }
  else {
    $(".pop-up-window").hide();
    $(".big-pop-up-window").show();
  }

  var content = $('#' + content_id);
  $('#login-content').addClass('active');
  content.fadeIn();
  scrollable = content.find(".content");
  scrollable.jScrollPane();
  api = scrollable.data('jsp');
  if(api != null) {
    setTimeout(api.reinitialise, 0);
  }
}

function showBack(backContainer) {
  $('.back-popup-button').show();
  $('.back-popup-button').unbind('click');
  $('.back-popup-button').click(function() {
    showPopUp(backContainer);
  });
}

function switchBack(backContainer) {
  $('.back-popup-button').show();
  $('.back-popup-button').unbind('click');
  $('.back-popup-button').click(function() {
    showPopUp(backContainer);
  });
}


function signupActions() {
  $('#signup-submit').click(function() {
    if($(this).hasClass("enabled")) {
      $(this).parent('form').submit();
    }
  });

  // agree terms action
  $('#agree-terms').click(
    function() {
      showPopUp('terms-content');
      //close button in terms show registration form again instead of close popup
      $('#big-close-icon').removeClass('active');
      $('#big-close-icon').addClass('inactive');
      $('#back-icon').removeClass('inactive');
      $('#back-icon').addClass('active');
    });

  // agree privacy action
  $('#agree-privacy').click(
    function() {
      showPopUp('privacy-content');
      //close button in privacy show registration form again instead of close popup
      $('#big-close-icon').removeClass('active');
      $('#big-close-icon').addClass('inactive');
      $('#back-icon').removeClass('inactive');
      $('#back-icon').addClass('active');
    });

  // validate terms and privacy for form submission
  $('#terms-and-privacy>input').each(
    function() {
      $(this).click(
        function() {
          if($('#terms-checkbox').is(':checked') && $('#privacy-checkbox').is(':checked')) {
            $('#signup-submit').removeClass("disabled");
            $('#signup-submit').addClass("enabled");
          }
          else {
            $('#signup-submit').addClass("disabled");
            $('#signup-submit').removeClass("enabled");
          }
        });
    });
}

function initialize() {
  soundManager.url = '/assets/sm2/';
  soundManager.flashVersion = 9; // optional: shiny features (default = 8)
  soundManager.useFlashBlock = false; // optionally, enable when you're ready to dive in
  soundManager.useFastPolling = true; // increased JS callback frequency, combined with useHighPerformance = true

  threeSixtyPlayer.config = {
    playNext:true,
    autoPlay:true,
    loop:true,
    allowMultiple:false,
    loadRingColor:'#626262',
    playRingColor:'#D7D7D7',
    backgroundRingColor:'#000000',
    circleDiameter:null,
    circleRadius:null,
    animDuration:500,
    animTransition:Animator.tx.bouncy,
    showHMSTime:false,

    useWaveformData:false,
    waveformDataColor:'#395252',
    waveformDataDownsample:5,
    waveformDataOutside:false,
    waveformDataConstrain:false,
    waveformDataLineRatio:0.58,

    useEQData:false,
    eqDataColor:'#544545',
    eqDataDownsample:4,
    eqDataOutside:true,
    eqDataLineRatio:0.54,

    usePeakData:false,
    peakDataColor:'#ff33ff',
    peakDataOutside:true,
    peakDataLineRatio:0.5,

    useAmplifier:true,
    useFavIcon:false         // favicon is expensive CPU-wise, but can be enabled.
  }

  threeSixtyPlayer.config.scaleFont = (navigator.userAgent.match(/msie/i) ? false : true);
  threeSixtyPlayer.flash9Options = {};

  // enable this in SM2 as well, as needed
  if(threeSixtyPlayer.config.useWaveformData) {
    soundManager.flash9Options.useWaveformData = true;
  }
  if(threeSixtyPlayer.config.useEQData) {
    soundManager.flash9Options.useEQData = true;
  }
  if(threeSixtyPlayer.config.usePeakData) {
    soundManager.flash9Options.usePeakData = true;
  }

  if(threeSixtyPlayer.config.useWaveformData || threeSixtyPlayer.flash9Options.useEQData || threeSixtyPlayer.flash9Options.usePeakData) {
    // even if HTML5 supports MP3, prefer flash so the visualization features can be used.
    soundManager.preferFlash = true;
  }

  // Adds placeholder to the jQuery support variables
  jQuery.support.placeholder = false;
  var phTest = document.createElement('input');
  if('placeholder' in phTest) {
    jQuery.support.placeholder = true;
  }

  $(document).ready(
    function() {
      $(".new-tab").each(
        function() {
          $(this).click(function() {
            window.open(this.href);
            return false;
          })
          $(this).keypress(function() {
            window.open(this.href);
            return false;
          })
        }
      )
    });
}
