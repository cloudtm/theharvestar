###############################################################################
###############################################################################
#
# This file is part of TheHarvestar.
#
# TheHarvestar is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# TheHarvestar is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with TheHarvestar.  If not, see <http://www.gnu.org/licenses/>.
#
# Copyright (c) 2010-2013 Algorithmica Srl
#
#
# Contact us via email at info@algorithmica.it or at
#
# Algorithmica Srl
# Largo Alfredo Oriani 12
# 00152 Rome, Italy
#
###############################################################################
###############################################################################

# This action joins the user to a game.
#
# === Accepted parameters
# * game_id: game id to join, or...
# * game_name: ... game name to join.
#
# This allows you to specify the game to join by id or by name.
#
# === Applicability
# * The game to join must exist.
# * The game must not be full.
# * The user can not join the same game he is already playing.
# * The user can play only one game at the time.
#
# === Trace
# Nothing.
#
# === Perception
# * Game
# * All players

module Actions
  class SelectAvatarAction < Madmass::Action::Action
    extend ActiveModel::Translation
    include Actions::PerceptionHelper

    action_params :avatar
    action_states :join

    # [OPTIONAL]  Add your initialization code here.
    # def initialize params
    #   super
    #  # My initialization code
    # end


    # [MANDATORY] Override this method in your action to define
    # the action effects.
    def execute
      DataModel::Player.current.update_attribute(:avatar, @parameters[:avatar])
      #trace :current, :game
    end

    # [MANDATORY] Override this method in your action to define
    # the perception content.
    def build_result
      p = Madmass::Perception::Percept.new(self)
      p.add_headers({ :topics => ['list'] }) #who must receive the percept
      p.data = DataModel::Game.current.to_percept.merge(
        :user_id => User.current.id,
        :user_state => User.current.state,
        :users => user_data,
        :event => 'select-avatar'
      )
      Madmass.current_perception << p
    end

    # [OPTIONAL] - The default implementation returns always true
    # Override this method in your action to define when the action is
    # applicable (i.e. to verify the action preconditions).
    def applicable?
      
      unless User.joined?
        why_not_applicable.publish(
          :name => :cannot_select_avatar, 
          #:message => I18n.t(:'action.cannot_select_avatar'), 
          :key => 'action.cannot_select_avatar',
          :recipients => [User.current.id])
      end
      return why_not_applicable.empty?
    end

    # [OPTIONAL] Override this method to add parameters preprocessing code
    # The parameters can be found in the @parameters hash
    # def process_params
    #   puts "Implement me!"
    # end

  end

end
