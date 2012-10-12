class CreatePlayers < ActiveRecord::Migration
  def change
    create_table :players do |t|
      t.string :state
      t.string :avatar, :default => 'none'
      t.integer :slot, :default => 1
      t.integer :silicon, :energy, :water, :titanium, :grain, :score, :magic_resource, :default => 0
      t.boolean :ready, :default => false
      t.references :user, :game
      t.timestamps
    end
  end
end
