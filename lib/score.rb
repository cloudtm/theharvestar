  class Score

    class << self

      # Updates the score of the current player
      def update_score
        # settlement score
        return DataModel::Player.current.score unless DataModel::Game.current
        DataModel::Player.current.save!
        self.winner?

        # fire a state change
        DataModel::Game.current.score_changed
        return DataModel::Player.current.score
      end

      def winner?
        if(DataModel::Player.current.total_score >= GameOptions.options(DataModel::Game.current.format)[:winner_score] and not DataModel::Game.current.winner)
         and_the_winner_is DataModel::Player.current
        end
      end

      #increases the settlement and cultural level score of the current player
      def increase_score inc = 1
        DataModel::Player.current.score ||= 0
        DataModel::Player.current.score += inc
      end

      # Returns the total score.
      # The total score is the actual score plus points of challenges where
      # the player is the leader.
      def total_score(player)
        tscore = player.score || 0 # monotonic score (can not decrese) FIXME naming
        # add the transport challenge points
        tscore += transport_score(player)
        # add the social challenge points
        tscore += social_score(player)
        # add the victory points
        tscore += victory_score(player)
        tscore
      end

      # Returns the amount of points provided by the transport challenge. The amount is zero
      # if the player is not the transport leader.
      def transport_score(player)
        player.game_transport_leader ? GameOptions.options(DataModel::Game.current.format)[:transport_challenge_points] : 0
      end

      # Returns the size of the longest road (called the transport score).
      def transport_level(player)
        # roads not placed 
        roads = player.placed_roads
        #create array of edges (eg, pairs of nodes)
        edges = []
        roads.each do |r|
           edge = r.to_edge
           n1 = edge.vertexes[0]
           n2 = edge.vertexes[1]
           edges <<  [n1.to_s, n2.to_s]
        end
        p = Map::LongestPath::Planner.new
        # TODO return the actual longest path to display in UI (not just the length)
        return p.longest_path_len edges
      end

      # Returns the amount of points provided to the game winner.
      def victory_score(player)
        (player == DataModel::Game.current.winner) ? GameOptions.options(DataModel::Game.current.format)[:victory_bonus] : 0
      end

      # Returns the amount of social progresses used by the player.
      def social_level(player)
        Rails.logger.debug "@@@@@@@@@@@@ PLAYER IN SOCIAL LEVEL: #{player.inspect} "
        0 #player.red_progresses.where('type = ?' , 'SocialProgress').count
      end

      # Returns the amount of cultural progresses used by the player.
      def cultural_level(player)
        0 #player.red_progresses.where('type = ?' , 'CulturalProgress').count
      end

      # Returns the amount of points provided by the social challenge. The amount is zero
      # if the player is not the social leader.
      def social_score(player)
        player.game_social_leader ? GameOptions.options(DataModel::Game.current.format)[:social_challenge_points] : 0
      end


      # Invoked when a player wins the game.
      def and_the_winner_is player
        DataModel::Game.current.winner = player
        DataModel::Game.current.save!
        update_global_scores
      end

      private

      # Updates the golabal  score of all users when the game ends.
      # BUT: do not update score for a user playing a demo game
      def update_global_scores
        return unless social_goal_achieved?
        DataModel::Game.current.players.each do |player|
          score = player.total_score
          # add the game score with the global score of the player
          player.user.update_attribute(:score, player.user.score + score)
        end if(DataModel::Game.current.players.size > 1) # When playing demo: Game.current.players.size == 1
      end

      def social_goal_achieved?
        DataModel::Game.current.players.each do |player|
          return false if(player.total_score < GameOptions.options(DataModel::Game.current.format)[:minimum_player_score])
        end
        return true
      end

    end

  end