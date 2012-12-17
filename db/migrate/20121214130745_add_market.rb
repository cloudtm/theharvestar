class AddMarket < ActiveRecord::Migration
  def change
  	create_table :offers do |t|
      t.text :give, :receive, :message
      t.integer :trade_request_id, :trader_id, :last_trader
      t.boolean :trader_agrees, :publisher_agrees

      t.timestamps
    end

    create_table :trade_requests do |t|
      t.integer :publisher_id
      t.text :receive
    end    
  end
end
