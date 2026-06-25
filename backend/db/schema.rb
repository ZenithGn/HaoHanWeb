# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 0) do
  create_table "bans", id: :integer, force: :cascade do |t|
    t.varchar "player_uuid", limit: 36, null: false
    t.varchar "admin_identifier", limit: 36, null: false
    t.string "reason", limit: 255, null: false
    t.datetime "banned_at", precision: nil, default: -> { "getdate()" }
    t.datetime "expires_at", precision: nil
    t.varchar "status", limit: 20, default: "ACTIVE"
    t.index ["player_uuid", "status"], name: "IX_Bans_PlayerUUID_Status"
  end

  create_table "card_details", primary_key: "donation_id", id: :integer, default: nil, force: :cascade do |t|
    t.varchar "card_type", limit: 20, null: false
    t.varchar "serial", limit: 50, null: false
    t.varchar "pin", limit: 50, null: false
    t.decimal "declared_value", precision: 15, scale: 2, null: false
  end

  create_table "donations", id: :integer, force: :cascade do |t|
    t.integer "player_id", null: false
    t.varchar "method", limit: 20, null: false
    t.decimal "amount", precision: 15, scale: 2, null: false
    t.varchar "tx_ref", limit: 100, null: false
    t.string "message", limit: 255
    t.varchar "status", limit: 20, default: "PENDING"
    t.datetime "created_at", precision: nil, default: -> { "getdate()" }
    t.datetime "updated_at", precision: nil, default: -> { "getdate()" }
    t.index ["tx_ref"], name: "IX_Donations_TxRef"
    t.index ["tx_ref"], name: "UQ__donation__933634EEE3DFD705", unique: true
  end

  create_table "players", id: :integer, force: :cascade do |t|
    t.varchar "username", limit: 16, null: false
    t.varchar "email", limit: 255
    t.varchar "uuid", limit: 36
    t.varchar "password_hash", limit: 255, null: false
    t.varchar "discord_id", limit: 20
    t.varchar "avatar_url", limit: 255
    t.decimal "total_donated", precision: 15, scale: 2, default: 0.0
    t.varchar "role", limit: 50, default: "default"
    t.boolean "is_linked", default: false
    t.integer "play_time", default: 0
    t.datetime "created_at", precision: nil, default: -> { "getdate()" }
    t.index ["discord_id"], name: "IX_Players_Discord"
    t.index ["discord_id"], name: "UX_Players_Discord", unique: true, where: "([discord_id] IS NOT NULL)"
    t.index ["email"], name: "UX_Players_Email", unique: true, where: "([email] IS NOT NULL)"
    t.index ["username"], name: "IX_Players_Username"
    t.index ["username"], name: "UQ__players__F3DBC572887243AD", unique: true
    t.index ["uuid"], name: "IX_Players_UUID"
    t.index ["uuid"], name: "UQ__players__7F42793172B11F90", unique: true
  end

  create_table "server_status_logs", id: :integer, force: :cascade do |t|
    t.integer "online_players", default: 0, null: false
    t.integer "max_players", default: 20, null: false
    t.decimal "tps", precision: 4, scale: 2, default: 20.0
    t.datetime "recorded_at", precision: nil, default: -> { "getdate()" }
    t.index ["recorded_at"], name: "IX_StatusLogs_Time"
  end

  add_foreign_key "card_details", "donations", name: "FK_CardDetails_Donations", on_delete: :cascade
  add_foreign_key "donations", "players", name: "FK_Donations_Players", on_delete: :cascade
end
