class AddDimensionsToAtlases < ActiveRecord::Migration
  def change
    change_table(:atlases) do |t|
      t.integer :rows, null: false
      t.integer :cols, null: false

      t.remove :atlas_pages
    end
  end
end
