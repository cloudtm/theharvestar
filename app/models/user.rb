class User < ActiveRecord::Base

  # associate the user with the Madmass Agent (the actions executor) in this case the Player.
  include GenericAssociation
  associate_with_agent(DataModel::Player)

  #has_many :user_stats TODO add UserStats

  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :token_authenticatable,
         :recoverable, :rememberable, :trackable, :validatable

  attr_accessor :crop_x, :crop_y, :crop_w, :crop_h
  after_update :delete_preview, :if => :cropping?

  MISSING_PICTURE_SUFFIX = "_missing_picture.jpeg".freeze unless defined? MISSING_PICTURE_SUFFIX


  # Setup accessible (or protected) attributes for your model
  #FRA_CHANGE name added
  attr_accessible :email, :nickname, :password, :password_confirmation,
                  :remember_me, :state, :first_name, :last_name, :picture,
                  :country, :language, :birthday, :gender, #,:name
                  :preview, :crop_x, :crop_y, :crop_w, :crop_h, :role, :agent_id

  #has_one :player, :dependent => :destroy TODO add Player

  has_attached_file :picture,
                    :styles => {:small => '50x50#', :detail => '200x200#'},
                    :default_url => "/assets/client/:style#{MISSING_PICTURE_SUFFIX}",
                    :processors => [:cropper]
  # Pictures for preview that will be deleted after the cropping operation:
  has_attached_file :preview, :styles => {:crop => '500x500>'}
  before_preview_post_process :transliterate_preview_name

  #validate :validate_player_and_game TODO readd after Player has been defined
  validates :nickname, :presence => true, :uniqueness => true, :length => {:in => 2..15}
  # enum_field :role, ['simple player', 'gm', 'admin'], :message => 'Unknown user role' TODO add enum_field

  # It sets system locale using the user locale.
  # Note: it takes in account only the lang information (e.g. if current user locale is en_US, locale will be just "en")
  def lang
    #FRA_REMOVE
    # locale.partition("_").first
    #FRA_FIXME
    "en"
  end

  def admin?
    self.role == 'admin'
  end

  def gm?
    self.role == 'gm'
  end

#*********************************************************************************∞
# Paperclip methotds
  def cropping?
    !crop_x.blank? && !crop_y.blank? && !crop_w.blank? && !crop_h.blank?
  end

  def preview_ratio
    preview_geometry(:original).width / preview_geometry(:crop).width
  end

  def preview_geometry(style = :original)
    @geometry ||= {}
    @geometry[style] ||= Paperclip::Geometry.from_file(preview.path(style))
  end

  def delete_preview
    begin
      [:original, :crop].each do |style|
        pic = preview.path(style)
        File.delete(pic) if (File.exists?(pic))
      end
    rescue
      logger.error "Error occurred in deliting preview pictures"
    end
  end

  def delete_picture_original
    pic = picture.path
    File.delete(pic) if (File.exists?(pic))
  end

  #*********************************************************************************∞

  class << self

    # FIXME: to remove
    def rank score
      return 0
#      min = User.minimum("score")
#      max = User.maximum("score")
#      score_range = max - min
#      normalized_score = (score_range == 0 ? 0 : Float(score-min)/Float(score_range))
#      result = (normalized_score*100).round
#      if result > 100
#        raise "user score cannot be greater than the maximum score"
#      end
#      return result
    end


    #Returns a hash representation of the current user
    def to_hash
      User.current ? User.current.to_hash : {}
    end

    # Updates the golabal  score of all users when the game ends
    #    def update_global_scores winner_id
    #      Game.current.players.each do |player|
    #        player.reload
    #        if player.id == winner_id
    #          player.user.score += player.score * 2 # FIXME put in game options
    #        else
    #          player.user.score += player.score
    #        end
    #        player.user.save!
    #      end
    #    end

    # Joins to the game identified by game_id the current user
    # by creating for the user a new player and by joining him to the game.
    # The method returns the channel for the game and the list of current players
    # game_id must be a valid game id. We do not check it here create the player
    # associated to this user in this game
    def join(game_id, slot = 1)
      DataModel::Game.current = DataModel::Game.find_by_id game_id
      unless User.current.player
        # we cannot use the game_id column because this code use both Relational and Cloudtm models
        new_player = DataModel::Player.create(:game => DataModel::Game.current, :slot => slot, :user => User.current)
        User.current.player = new_player
      else
        user_player = User.current.player
        user_player.game = DataModel::Game.current
        # FIXME: this don't works in the dml
        #user_player.game_id = DataModel::Game.current.id
        user_player.slot = slot.to_i
        user_player.save
      end
      # User.current.create_player(:game_id => game_id, :slot => slot) unless User.current.player
      # set the current player in order to provide simplified access to all the application
      DataModel::Player.current = User.current.player
      # set the current game to provide simplified access to all the application
      DataModel::Game.current = DataModel::Game.find_by_id game_id
      DataModel::Game.current.fire_join

      # FIXME: move the user state in the Player with state_machine + action states
      User.current.update_attribute(:state, 'join')
    end

    # The current user leaves the game
    # Note: pay attention with Player.current = nil assignments. This method must be ROLLBACK resistant :)
    def leave
      # We destroy the current player (not the user)
      DataModel::Player.current.destroy
      unless DataModel::Game.current
        Rails.logger.debug ">>>>>>>>>>>>>>>>> USER:LEAVE => Game don't exists <<<<<<<<<<<<<<<<<<<<<"
        DataModel::Player.current = nil
        return
      end
      # If there is no one left in the game, we destroy it
      # TODO: check in AR, this may cause subtle errors, maybe the reset is required
      #DataModel::Game.current.players.reset
      DataModel::Game.current.leave
      #game_zombie = DataModel::Game.current.clone # shallow clone, sufficient to grab the state_transition that can be triggered by next_state!
      #game_zombie[:id] = DataModel::Game.current.id #removed by the active record clone (ar removes primary key from clone)
      # TODO: check what game properties are needed from unjoin game action (pass them as to_hash argument)
      game_zombie = DataModel::Game.current.to_hash([:id, :version])
      Rails.logger.debug ">>>>>>>>>>>>>>>>> USER:LEAVE => zombie: #{game_zombie.inspect} <<<<<<<<<<<<<<<<<<<<<"
      if DataModel::Game.current.players.empty?
        DataModel::Game.current.destroy
      end
      DataModel::Player.current = nil
      DataModel::Game.current = nil

      # FIXME: move the user state in the Player with state_machine + action states
      User.current.update_attribute(:state, 'list')

      return game_zombie
    end

    #The player has already joined the target game?
    def joined?
      player = User.current.player
      Rails.logger.debug "@@@@@@@@ INCLUDE: #{DataModel::Game.current.player_in_game?(player)}"
      return DataModel::Game.current.player_in_game?(player) # game current is set by the join game action
    end

    #The player is playing a game?
    def playing?
      current.state == 'play'
      #Player.current
    end

    # Sets the current user for a request cycle
    # If the user, through a player, is already playing a game the current player
    # and current game are also set.
    def current=(user)
      Thread.current[:user] = user
      unless user and user.player
        DataModel::Player.current = nil
        DataModel::Game.current = nil
        return
      end
      ## set the current player
      #DataModel::Player.current = DataModel::Player.find(user.player.id)
      ## set the current game
      #DataModel::Game.current = DataModel::Game.find(Player.current.game.id)
    end

    #The user in the current request cycle
    def current
      Thread.current[:user]
    end

  end

  def to_hash(selection = nil)
    #client needs image_url info to display the user image. This method is called on in perception builder on the user instance
    result = super
    result[:image_url] = picture.url(:small)
    result
  end

  def collect_stats
    total_score = 0; total_games = 0; avatars = {}
    user_stats.each do |stat|
      next if stat.game_type.player_number == 1 #skip tutorials games
      total_score += stat.match_score
      total_games += stat.usage_count
      stat.avatar_stats.each do |avatar_stat|
        avatars[avatar_stat.avatar_name] ||= 0
        avatars[avatar_stat.avatar_name] += avatar_stat.usage_count
      end
    end

    max_avatar_count = 0; avatar = 'starr'
    avatars.each_pair do |name, count|
      if count > max_avatar_count
        avatar = name
        max_avatar_count = count
      end
    end

    {:total_score => total_score, :total_games => total_games, :avatar => avatar}

  end

  private

  # If the user has a player then it must have a game too!
  def validate_player_and_game
    return (not player.game.nil?) if player
    true
  end

  def transliterate(str)
    # Based on permalink_fu by Rick Olsen

    # Escape str by transliterating to UTF-8 with Iconv
    s = Iconv.iconv('ascii//ignore//translit', 'utf-8', str).to_s

    # Downcase string
    s.downcase!

    # Remove apostrophes so isn't changes to isnt
    s.gsub!(/'/, '')

    # Replace any non-letter or non-number character with a space
    s.gsub!(/[^A-Za-z0-9]+/, ' ')

    # Remove spaces from beginning and end of string
    s.strip!

    # Replace groups of spaces with single hyphen
    s.gsub!(/\ +/, '-')

    return s
  end

  def transliterate_preview_name
    extension = File.extname(preview.original_filename).gsub(/^\.+/, '')
    filename = preview.original_filename.gsub(/\.#{extension}$/, '')
    preview.instance_write(:file_name, "#{transliterate(filename)}.#{transliterate(extension)}")
  end

end
