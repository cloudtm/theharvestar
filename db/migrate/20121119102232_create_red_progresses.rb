class CreateRedProgresses < ActiveRecord::Migration
  def change
  	create_table :red_progresses do |t|
      t.string :type
      t.references :player
      t.boolean :used, :default => false
      t.timestamps
    end
  end
end
