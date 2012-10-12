class CreateTerrains < ActiveRecord::Migration
  def change
    create_table :terrains do |t|
      t.string :terrain_type
      t.integer :x, :y, :production_probability
      t.references :game
      t.timestamps
    end
  end
end
