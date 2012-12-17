class CreateRoads < ActiveRecord::Migration
  def change
    create_table :roads do |t|
      t.integer :x, :y
      t.boolean :from_progress, :default => false
      t.references :player, :game
      t.timestamps
    end

    create_table :roads_terrains, :id => false do |t|
      t.references :road, :terrain
    end

    add_index(:roads_terrains, [:road_id, :terrain_id], :unique => true, :name => 'roads_terrains_key')
    add_index(:roads, :player_id)
  end
end
