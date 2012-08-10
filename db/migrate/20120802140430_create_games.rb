class CreateGames < ActiveRecord::Migration
  def change
    create_table :games do |t|
      t.string :name, :format, :state
      t.references :social_leader, :transport_leader, :winner
      t.integer :version, :social_count, :transport_count, :default => 0
      t.timestamps
    end
  end
end
