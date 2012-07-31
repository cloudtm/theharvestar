class AddGvisionColumnsToUser < ActiveRecord::Migration
  def change

    change_table :users do |t|
      t.string :last_name
      t.string :first_name
      t.string :nickname
      t.string :gender
      t.integer :score, :default => 0
      t.string :state, :default => "list"
      t.string :picture_file_name
      t.string :picture_content_type
      t.integer :picture_file_size
      t.datetime :picture_updated_at
      t.string :language
      t.date :birthday
      t.string :country
      t.text :settings
      t.string :role, :default => "simple player"
      t.string :preview_file_name
      t.string :preview_content_type
      t.integer :preview_file_size
      t.datetime :preview_updated_at
    end

  end
end
