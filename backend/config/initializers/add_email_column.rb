# config/initializers/add_email_column.rb

Rails.application.config.after_initialize do
  begin
    if ActiveRecord::Base.connection.table_exists?('players')
      # 1. Handle email column
      unless ActiveRecord::Base.connection.column_exists?('players', 'email')
        puts "Email column not found in 'players' table. Adding it..."
        ActiveRecord::Base.connection.execute("ALTER TABLE players ADD email VARCHAR(255) NULL")
        
        # Add filtered unique index to handle multiple legacy NULL emails
        puts "Creating UX_Players_Email filtered index..."
        ActiveRecord::Base.connection.execute("CREATE UNIQUE NONCLUSTERED INDEX UX_Players_Email ON players(email) WHERE email IS NOT NULL")
        
        puts "Successfully added email column and UX_Players_Email index to players table!"
      end

      # 2. Fix discord_id unique constraint (SQL Server UNIQUE constraint doesn't allow multiple NULLs)
      # Find the constraint name dynamically
      constraints = ActiveRecord::Base.connection.select_values("
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'players' AND cc.column_name = 'discord_id' AND tc.constraint_type = 'UNIQUE'
      ")

      constraints.uniq.each do |cname|
        puts "Dropping unique constraint #{cname} on players(discord_id)..."
        ActiveRecord::Base.connection.execute("ALTER TABLE players DROP CONSTRAINT #{cname}")
      end

      # Check if filtered index already exists
      has_index = ActiveRecord::Base.connection.select_value("
        SELECT 1 FROM sys.indexes WHERE name = 'UX_Players_Discord' AND object_id = OBJECT_ID('players')
      ")

      unless has_index
        puts "Creating UX_Players_Discord filtered unique index..."
        ActiveRecord::Base.connection.execute("
          CREATE UNIQUE NONCLUSTERED INDEX UX_Players_Discord 
          ON players(discord_id) 
          WHERE discord_id IS NOT NULL
        ")
        puts "Successfully created filtered unique index for discord_id!"
      end
    end
  rescue => e
    Rails.logger.warn "Could not check/migrate players database schema: #{e.message}"
    puts "Warning: Database migration skipped or failed: #{e.message}"
  end
end
