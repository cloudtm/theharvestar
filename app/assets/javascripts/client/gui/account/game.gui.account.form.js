/** User: marco * Date: 02/05/12 * Time: 17.53 **/
// Hiscores LIst
Game.Gui.AccountForm = new Class({
  Extends: Game.Gui.Item,
  name: "AccountForm",

  options: {
    template: 'account-form',
    placeholder: 'placeholder'    // placeholder class
  },

  init: function(options){
    var self = this;
    this.cropper = null;
    this.changed = false;
    this.account = {
      image: this.element.find(".detail-image"),
      nickname: this.element.find(".nickname"),
      email: this.element.find(".email"),
      firstName: this.element.find(".first_name"),
      lastName: this.element.find(".last_name"),
      language: this.element.find(".language"),
      country: this.element.find(".country"),
      birthday: this.element.find(".birthday"),
      birthdayFormat: CONFIG.translation({key: 'account.form.date_format'}),
      gender: this.element.find(".gender")
    }
    this.account.image.on({click: this.picture.bind(this)});

    this.notification = this.element.find('.notification');
    this.gui.append(this.notification);

    // Stylizes the selecton boxes with the selectmenu jquery ui plugin
    var selectIndex = 0;
    var selectStyle = {
      style: 'popup',
      maxHeight: 200,
      width: 270,
      menuWidth: 270,
      format: function(text){
        if(selectIndex++ === 0){
          text = "<span style='color:#A9A9A9;'>" + text + "</span>";
        };
        return text;
      },
      change: function(e, object){ self.formChanged(object.option.parentNode); }
    }
    this.account.language.selectmenu(selectStyle);
    selectIndex = 0;
    this.account.gender.selectmenu(selectStyle);
    selectIndex = 0;
    selectStyle.icons = $.map($('#game_account_country').children(), function(o){
      var flag = o.classList[0];
      if(flag) return {find: "." + flag, icon: "flag " + flag};
    });
    this.account.country.selectmenu(selectStyle);

    // Prepare buttons -------------------------------------------------------------
    this.btnBack = new Game.Gui.Button({
      anchor: {custom: 'btn-back'}, template: 'none', text: "<div class='text'></div>",
      call: this.back.bind(this)
    });
    this.appendChild(this.btnBack, '.nav');

    this.btnSave = new Game.Gui.Button({
      anchor: {custom: 'btn-save'}, template: 'none', text: "<div class='text'></div>",
      call: this.save.bind(this)
    });
    this.appendChild(this.btnSave, '.nav');

    this.btnPicture = new Game.Gui.Button({
      anchor: {custom: 'btn-picture'}, template: 'none', text: "<div class='text'></div>",
      call: this.picture.bind(this)
    });
    this.appendChild(this.btnPicture, '.nav');

    // Attaches some behavior to the inputs ---------------------------------------
    this.form = { inputs : $('input:enabled',this.element) };
    this.form.first = this.form.inputs.eq(0);
    this.form.inputs.on({
      //keyup: function(event){ if(event.keyCode == 13 || event.keyCode == 9) nextInput($(this)); },
      keydown: function(event){ if(event.keyCode == 13) nextInput($(this)); },
      focus: function(event){ self._placeholder($(this), false); },
      blur: function(event){ self._placeholder($(this), true); },
      change: function(event){ self.formChanged(this); }
    });

    function nextInput(input){
      var next = input.next(':enabled');
      if(next.length == 0){ next = self.form.first; }
      next.focus();
    }

    this.account.birthday.datepicker({
      changeMonth: true,
      changeYear: true,
      formatDate: this.account.birthdayFormat,
      yearRange: "-99:+0",
      constrainInput: true,
      beforeShow: function(input, inst){
        return {defaultDate: self.account.birthday.date};
      },
      onSelect: function(dateText, inst){
        var newDate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);

        if(!sameDate(self.account.birthday.date, newDate)){
          self.account.birthday.date = newDate;
          self.formChanged(this);
        }
        var formattedDate = $.datepicker.formatDate(self.account.birthdayFormat, newDate);
        self.account.birthday.focus().val(formattedDate);

        function sameDate(date1, date2){
          return ($.datepicker.formatDate(self.account.birthdayFormat, date1) == $.datepicker.formatDate(self.account.birthdayFormat, date2));
        }
      }
    }).on({ mousedown: function(event){$(this).datepicker('show');} });

    // Listeners -------------------------------------------------------------
    this.mapListeners([
      {map: $msg.info.accountStart, to: this.start},
      {map: $msg.info.accountStop, to: this.stop},
      {map: $msg.update.account, to: this.saved}
    ]);
    $log("Game.Gui.AccountForm: added.");
  },

  /**********************************************************************************/
  // BOARD ENTRY FUNCTONS
  start: function(account){
    this.changed = false;

    if(!this.userInfo){
      this.userInfo = new Game.Gui.UserInfo({
        x: 201, y: -46,
        user: account,
        subs: {
          name: account.nickname,
          slot: 1,
          avatar: account.avatar
        }
      });
      this.appendChild(this.userInfo, '.form');
    }
    this.update(account);
  },

  stop: function(){
    this.changed = false;
    this.notification.hide();
  },

  /**********************************************************************************/
  // PLACEHOLDER MANAGEMENT
  _placeholder: function(input, active){
    if($.support.placeholder){ return; }
    if(active){
      if(input.val() == ''){
        var ph = input.attr('placeholder');
        if(ph){ input.val(ph).addClass(this.options.placeholder); }
      }
    } else {
      if(input.hasClass(this.options.placeholder)){
        input.removeClass(this.options.placeholder).val('');
      }
    }
  },

  /**********************************************************************************/
  // BUTTONS
  back: function(){
    $send($msg.rpc.list);
  },

  save: function(){
    if(!this.changed){return;}
    var self = this;
    $send($msg.rpc.account, {
      //nickname: this.account.nickname.val(),
      //email: this.account.email.val(),
      'first_name': value(this.account.firstName),
      'last_name': value(this.account.lastName),
      language: value(this.account.language),
      country: value(this.account.country),
      birthday: value(this.account.birthday),
      gender: value(this.account.gender)
    });

    // Returns the true value of the input, filtering out the placeholder text
    function value(input){
      if(input.hasClass(self.options.placeholder)){
        return '';
      } else {
        return input.val();
      }
    }
  },

  saved: function(account){
    if(!account.newpicture){
      this.changed = false;
      this.notification.removeClass('notsaved').html(CONFIG.translation({key: 'account.form.saved'})).fadeIn();
    }
    this.update(account);
  },

  picture: function(){
    if(!this.cropper){
      GUI.modal(true);
      this.cropper = new Game.Gui.Cropper;
      GUI.appendChild(this.cropper);
      this.observe(this.cropper);
    }
  },

  formChanged: function(input){
    this.changed = true;
    this.notification.addClass('notsaved').html(CONFIG.translation({key: 'account.form.changes'})).fadeIn();
  },

  // Observer method. Called to know when the cropper closes.
  notify: function(obj, event){
    if(event == Core.Events.destroyed){
      GUI.modal(false);
      this.cropper = null;
    }
  },

  /**********************************************************************************/
  // ACCOUNT UPDATE
  update: function(account){
    var self = this, autoSet = false;

    if(imageChanged()){  // avoid filckering if picture not changed
      this.account.image.css('background-image', 'url(' + account.image + ')');
      this.userInfo.element.find('.fb-image').css('background-image', 'url(' + account.image_url + ')');
    }
    if(account.newpicture){ return; }

    update(this.account.nickname, account.nickname);
    update(this.account.email, account.email);
    update(this.account.firstName, account.first_name);
    update(this.account.lastName, account.last_name);

    if(!account.language || account.language == ''){
      account.language = GAME.geo.lang;
      autoSet = true;
    }
    this.account.language.selectmenu('value', account.language);

    if(!account.country || account.country == ''){
      account.country = GAME.geo.countryCode;
      autoSet = true;
    }
    this.account.country.selectmenu('value', account.country);

    if(!account.gender || account.gender == ''){
      this.account.gender.selectmenu('index', 0);
    } else {
      this.account.gender.selectmenu('value', account.gender);
    }

    update(this.account.birthday, account.birthday);

    if(autoSet){
      // Better to not signal changes at this stage as it can confuse the user
      //this.changed = true;
      //this.notification.addClass('notsaved').html(CONFIG.translation({key: 'account.form.changes'})).fadeIn();
    }

    // Wraps the input update with the placeholder if necessary
    function update(input, value){
      self._placeholder(input, false);
      // Special treatment for the birthday date
      if(input == self.account.birthday && $defined(value)){
        input.date = new Date(value);
        value = $.datepicker.formatDate(self.account.birthdayFormat, input.date);
      }
      input.val(value);
      self._placeholder(input, true);
    }

    function imageChanged(){
      var currImg = self.account.image.css('background-image');
      var currImgId = currImg.split('?')[1];
      var changed = account.newpicture || currImg == 'none' || !$defined(currImgId) || (currImgId != (account.image +')').split('?')[1]);
      return changed;
    }
  }

});

/***************************************************************************/
// Cropper Dialog
Game.Gui.Cropper = new Class({
  Extends: Game.Gui.Item,
  name: "Cropper",

  options: {
    template: 'picture-cropper'
  },

  init: function(options){
    this.cropArea = this.element.find('.crop-area');
    this.loader = $('<div class="loader"></div>');
    this.fileLoad = this.element.find('.file-load');
    this.previw50 = this.element.find('.preview50');
    this.previw200 = this.element.find('.preview200');
    this.progress = {
      bar: this.element.find('.bar'),
      num: this.element.find('.perc')
    }
    this.crop = {x:0,y:0,w:0,h:0};

    // Buttons ---------------------------------------------------
    var btnFile = new Game.Gui.Button({
      anchor: {custom: 'file'}, template: 'none', text: "CHOOSE IMAGE"
    });
    this.appendChild(btnFile);
    // Puts the input file selector inside the button for hover purposes
    this.fileLoad.appendTo(btnFile.element);

    this.btnSave = new Game.Gui.Button({
      anchor: {custom: 'save'}, template: 'none', text: "SAVE",
      call: this.save.bind(this),
      enabled: false
    });
    this.appendChild(this.btnSave);

    this.btnCancel = new Game.Gui.Button({
      anchor: {custom: 'cancel'}, template: 'none', text: "CANCEL",
      call: this.cancel.bind(this)
    });
    this.appendChild(this.btnCancel);
  },

  afterAppend: function(){
    // Centers it in the visible window
    var win = $(window);
    var offset = Math.max(0, (win.height() - this.element.height()) / 2);
    this.moveTo((
      GAME.gui.width() - this.element.width()) / 2,
      win.scrollTop() + offset
    );
    // Attaches the upload plugin to the choos file button
    this._attachUploader();
  },

  _attachUploader: function(){
    var self = this;
    this.fileLoad.fileupload({
      url: '/games/account',
      progressall: progress,
      submit: check,
      start: start,
      done: this._startCrop.bind(this)
    });

    // Check if it's really an image
    function check(e, data){
      var file = data.files[0];
      var accepted = (file.type.split('/')[0] == 'image');
      if(!accepted) alert("Please choose a valid image file.");
      return accepted;
    }

    function start(e, data9){
      self.btnCancel.enable(false);
      self.clean();
    }

    function progress(e, data){
      var perc = parseInt(data.loaded / data.total * 100, 10);
      self.progress.bar.css('width', perc + '%');
      self.progress.num.html(perc + '%');
      if(perc >= 100){
        self.loader.appendTo(self.cropArea);
      }
    }
  },

  /**************************************************************************/
  // Crop functions
  _startCrop: function(e, data){
    var self = this, img = new Image;
    this.ratio = data.result.ratio;
    img.onload = attachCropper;
    img.src = data.result.tocrop;

    function attachCropper(){
      self.loader.detach();
      self.cropArea.empty();
      self.cropArea.append(img);

      // Prepare previews
      var img50 = $('<img src="' + data.result.tocrop + '">');
      var img200 = $('<img src="' + data.result.tocrop + '">');
      self.previw50.append(img50);
      self.previw50.img = img50;
      self.previw200.append(img200);
      self.previw200.img = img200;

      // Attaches the image area selection box
      var imgCx = img.width / 2;    // center x
      var imgCy = img.height / 2;   // center y
      var dim = Math.min(200, img.width > img.height ? img.height : img.width);  // lower dimension
      self.crop.x = imgCx - dim/2;
      self.crop.y = imgCy - dim/2;
      self.crop.w = dim;
      self.crop.h = dim;
      self.ias = $(img).imgAreaSelect({
        parent: self.element,
        handles: true,
        aspectRatio: "1:1",
        x1: self.crop.x,
        y1: self.crop.y,
        x2: self.crop.x + self.crop.w,
        y2: self.crop.y + self.crop.h,
        onSelectChange: updateCrop,
        onSelectStart: updateCrop,
        instance: true
      });
      self.btnSave.enable(true);
      self.btnCancel.enable(true);
      updatePreview();
    }

    function updateCrop(img, sel){
      self.crop.x = sel.x1;
      self.crop.y = sel.y1;
      self.crop.w = sel.width;
      self.crop.h = sel.height;
      updatePreview();
    }

    function updatePreview(){
      var p50rx = 50/self.crop.w, p50ry = 50/self.crop.h;
      var p200rx = 200/self.crop.w, p200ry = 200/self.crop.h;
      self.previw50.img.css({
        width: Math.round(p50rx * img.width) + 'px',
        height: Math.round(p50ry * img.height) + 'px',
        marginLeft: '-' + (Math.round(p50rx * self.crop.x) + 4) + 'px',
        marginTop: '-' + (Math.round(p50ry * self.crop.y) + 4) + 'px'
      });
      self.previw200.img.css({
        width: Math.round(p200rx * img.width) + 'px',
        height: Math.round(p200ry * img.height) + 'px',
        marginLeft: '-' + Math.round(p200rx * self.crop.x) + 'px',
        marginTop: '-' + Math.round(p200ry * self.crop.y) + 'px'
      });
    }

  },

  // Cleans crop area and removes imgAreaSelect rubbish
  clean: function(){
    this.loader.detach();
    this.cropArea.empty();
    this.previw50.empty();
    this.previw200.empty();
    this.btnSave.enable(false);
    $('.imgareaselect-selection').parent().remove();
    $('[class^=imgareaselect]').remove();
  },

  save: function(){
    // Sends cropping parameters
    $send($msg.rpc.account, {
      'crop_x': Math.floor(this.crop.x * this.ratio),
      'crop_y': Math.floor(this.crop.y * this.ratio),
      'crop_w': Math.floor(this.crop.w * this.ratio),
      'crop_h': Math.floor(this.crop.h * this.ratio)
    });
    this.close();
  },

  cancel: function(){
    $send($msg.rpc.account, {cancel: 1});
    this.close();
  },

  close: function(){
    if(this.ias) this.ias.cancelSelection();
    this.clean();
    this.destroy();
  }
});
