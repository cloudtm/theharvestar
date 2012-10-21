class CreateSettlements < ActiveRecord::Migration
  def change
    create_table :settlements do |t|
      t.integer :level, :default => 1
      t.integer :x, :y
      t.references :player, :game
      t.timestamps
    end

    create_table :settlements_terrains, :id => false do |t|
      t.references :settlement, :terrain
    end

    add_index(:settlements_terrains, [:settlement_id, :terrain_id], :unique => true, :name => 'settlements_terrains_key')
    add_index(:settlements, :player_id)
  end
end
