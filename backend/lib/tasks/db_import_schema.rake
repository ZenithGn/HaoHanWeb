namespace :db do
  desc "Import schema from HaoHanDB.sql into SQL Server"
  task import_schema: :environment do
    sql_path = Rails.root.join("..", "HaoHanDB.sql")
    unless File.exist?(sql_path)
      puts "Error: SQL file not found at #{sql_path}"
      exit 1
    end

    puts "Importing schema from #{sql_path}..."
    sql_content = File.read(sql_path)
    
    # Split content by GO statements (lines that contain only GO or optional whitespace)
    batches = sql_content.split(/^\s*GO\s*$/i)

    ActiveRecord::Base.transaction do
      batches.each_with_index do |batch, index|
        # Clean comments and whitespace line by line
        clean_lines = []
        batch.each_line do |line|
          # Match -- comments and strip them
          clean_line = line.gsub(/--.*$/, '').strip
          clean_lines << clean_line unless clean_line.empty?
        end
        
        clean_batch = clean_lines.join(" ")
        next if clean_batch.empty?
        
        begin
          ActiveRecord::Base.connection.execute(clean_batch)
          puts "Executed batch #{index + 1}/#{batches.size} successfully."
        rescue => e
          puts "Error executing batch #{index + 1}: #{e.message}"
          puts "Batch content:\n#{clean_batch}"
          raise e
        end
      end
    end
    
    puts "Schema import finished successfully!"
  end
end
