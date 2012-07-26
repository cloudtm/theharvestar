/** User: marco * Date: 02/05/12 * Time: 18.00 **/
// Hiscores entry
Game.Gui.HiscoresEntry = new Class({
  Extends: Game.Gui.Item,
  name: "HiscoresEntry",

  options: {
    template: 'hiscore-entry'
  },

  init: function(options){
    var user = options.user;
    this.me = user.id == CONFIG.userId;
    if(this.me){ this.element.addClass('highlight'); }

    var userInfo = new Game.Gui.UserInfo({
      user: user,
      subs: {
        name: user.nickname,
        slot: 1,
        avatar: user.avatar
      }
    });
    this.appendChild(userInfo, '.infos');
  }

});

/***********************************************************************/
// User info block with user image, avatar and name
// The template is recycled from joined user

Game.Gui.UserInfo = new Class({
  Extends: Game.Gui.Item,
  name: "UserInfo",

  options: {
    template: 'joined-user'
  },

  init: function(options){
    this.user = options.user;
    this.id = this.user.id;

    this.element.find('.ready').remove();
    this.element.find('.player').remove();
    this.element.find(".fb-image").css('background-image', 'url(' + this.user.image_url + ')');
  }
});