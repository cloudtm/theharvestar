/***************************************************************************
                                 Game Utils
***************************************************************************/
Game.Helpers = {

  /* Given the user score returns:
   * - level: The user level
   * - percentage: percentage to complete this level
   * - range: points needed to complete this level
   * - progress: points completed for this level */
  userLevel: function(score){
    var progress = Math.pow(score, 0.46);
    var level = Math.floor(progress);

    // linearizes the level progress
    var levelScore = Math.floor(level == 0 ? 0 : Math.pow(level, 1/0.46));  // points for floored level
    var progressScore = score - levelScore; // points acquired in this level
    var deltaScore = Math.floor(Math.pow(level + 1, 1/0.46)) - levelScore;  // total points needed from this level to next one
    var percentage = (progressScore / deltaScore * 100).toFixed(1) + '%';

    return {level: level, percentage: percentage, range: deltaScore, progress: progressScore};
  },

  // Shows the element in page animating the scroll (if not visibe)
  showElement: function(element){
    var jWin = $(window);
    var winTop = jWin.scrollTop();
    var winHeight = jWin.height();
    var winBottom = winTop + winHeight;

    var eleTop = element.offset().top;
    var eleHeight = element.height();
    var eleBottom = eleTop + eleHeight;

    // do nothing if the element is contained in the window and is bigger
    // than the window or if it's completely visible in the window
    if((winTop >= eleTop && winBottom <= eleBottom) || (winTop <= eleTop && winBottom >= eleBottom)){ return; }

    var newTop, margin = 10;
    if(winTop < eleTop){
      newTop = winTop + (eleBottom - winBottom + margin);
    } else {
      newTop = Math.max(0, eleTop - margin);
    }
    $('html, body').animate({scrollTop: newTop}, 500);
  },

  // Do a JSON.stringify on the obj parameter. The obj can implement the toJSON method to provide its own representation.
  inspect: function(obj, nolog){
    var inspection = JSON.stringify(obj, null, '  ');
    if(nolog){
      return inspection;
    }
    $defined($log) ? $log(inspection) : console.info(inspection);
  },

  // Inspects visually a game board (switching to it but not changing GAME state)
  peek: function(board){
    var toPeek = $('#' + board);
    if(toPeek.length > 0){
      var onBoard = $('.desk').children(':visible');
      var onBoardName = onBoard.get(0).id;
      onBoard.hide(); // hides the current board...

      WORLD.element.removeClass(onBoardName);
      WORLD.element.addClass(board);

      toPeek.show();  // and shows the board to peek
    }
  },

  // Simple logout redirect
  logout: function(){
    window.location = "/signout";
  }
};

// Shortcuts
var $see = Game.Helpers.inspect;
var $peek = Game.Helpers.peek;
