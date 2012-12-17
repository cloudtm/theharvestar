# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20121214130745) do

  create_table "games", :force => true do |t|
    t.string   "name"
    t.string   "format"
    t.string   "state"
    t.integer  "social_leader_id"
    t.integer  "transport_leader_id"
    t.integer  "winner_id"
    t.integer  "version",             :default => 0
    t.integer  "social_count",        :default => 0
    t.integer  "transport_count",     :default => 0
    t.datetime "created_at",                         :null => false
    t.datetime "updated_at",                         :null => false
  end

  create_table "offers", :force => true do |t|
    t.text     "give"
    t.text     "receive"
    t.text     "message"
    t.integer  "trade_request_id"
    t.integer  "trader_id"
    t.integer  "last_trader"
    t.boolean  "trader_agrees"
    t.boolean  "publisher_agrees"
    t.datetime "created_at",       :null => false
    t.datetime "updated_at",       :null => false
  end

  create_table "players", :force => true do |t|
    t.string   "state"
    t.string   "avatar",         :default => "none"
    t.integer  "slot",           :default => 1
    t.integer  "version",        :default => 1
    t.integer  "silicon",        :default => 0
    t.integer  "energy",         :default => 0
    t.integer  "water",          :default => 0
    t.integer  "titanium",       :default => 0
    t.integer  "grain",          :default => 0
    t.integer  "score",          :default => 0
    t.integer  "magic_resource", :default => 0
    t.boolean  "ready",          :default => false
    t.integer  "user_id"
    t.integer  "game_id"
    t.datetime "created_at",                         :null => false
    t.datetime "updated_at",                         :null => false
  end

  create_table "red_progresses", :force => true do |t|
    t.string   "type"
    t.integer  "player_id"
    t.boolean  "used",       :default => false
    t.datetime "created_at",                    :null => false
    t.datetime "updated_at",                    :null => false
  end

  create_table "roads", :force => true do |t|
    t.integer  "x"
    t.integer  "y"
    t.integer  "player_id"
    t.integer  "game_id"
    t.datetime "created_at",                       :null => false
    t.datetime "updated_at",                       :null => false
    t.boolean  "from_progress", :default => false
  end

  add_index "roads", ["player_id"], :name => "index_roads_on_player_id"

  create_table "roads_terrains", :id => false, :force => true do |t|
    t.integer "road_id"
    t.integer "terrain_id"
  end

  add_index "roads_terrains", ["road_id", "terrain_id"], :name => "roads_terrains_key", :unique => true

  create_table "settlements", :force => true do |t|
    t.integer  "level",      :default => 1
    t.integer  "x"
    t.integer  "y"
    t.integer  "player_id"
    t.integer  "game_id"
    t.datetime "created_at",                :null => false
    t.datetime "updated_at",                :null => false
  end

  add_index "settlements", ["player_id"], :name => "index_settlements_on_player_id"

  create_table "settlements_terrains", :id => false, :force => true do |t|
    t.integer "settlement_id"
    t.integer "terrain_id"
  end

  add_index "settlements_terrains", ["settlement_id", "terrain_id"], :name => "settlements_terrains_key", :unique => true

  create_table "terrains", :force => true do |t|
    t.string   "terrain_type"
    t.integer  "x"
    t.integer  "y"
    t.integer  "production_probability"
    t.integer  "game_id"
    t.datetime "created_at",             :null => false
    t.datetime "updated_at",             :null => false
  end

  create_table "trade_requests", :force => true do |t|
    t.integer "publisher_id"
    t.text    "receive"
  end

  create_table "users", :force => true do |t|
    t.string   "email",                  :default => "",              :null => false
    t.string   "encrypted_password",     :default => "",              :null => false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          :default => 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.string   "authentication_token"
    t.datetime "created_at",                                          :null => false
    t.datetime "updated_at",                                          :null => false
    t.string   "agent_id"
    t.string   "last_name"
    t.string   "first_name"
    t.string   "nickname"
    t.string   "gender"
    t.integer  "score",                  :default => 0
    t.string   "state",                  :default => "list"
    t.string   "picture_file_name"
    t.string   "picture_content_type"
    t.integer  "picture_file_size"
    t.datetime "picture_updated_at"
    t.string   "language"
    t.date     "birthday"
    t.string   "country"
    t.text     "settings"
    t.string   "role",                   :default => "simple player"
    t.string   "preview_file_name"
    t.string   "preview_content_type"
    t.integer  "preview_file_size"
    t.datetime "preview_updated_at"
  end

  add_index "users", ["agent_id"], :name => "index_users_on_agent_id"
  add_index "users", ["authentication_token"], :name => "index_users_on_authentication_token", :unique => true
  add_index "users", ["email"], :name => "index_users_on_email", :unique => true
  add_index "users", ["reset_password_token"], :name => "index_users_on_reset_password_token", :unique => true

end
