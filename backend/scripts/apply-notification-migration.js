const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migrationSQL = `
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
    "daily_briefing": true,
    "weekly_report": true,
    "task_reminders": true,
    "achievements": true,
    "marketing": false
}'::jsonb;

UPDATE user_preferences
SET notification_settings = '{
    "daily_briefing": true,
    "weekly_report": true,
    "task_reminders": true,
    "achievements": true,
    "marketing": false
}'::jsonb
WHERE notification_settings IS NULL;
`;

async function runMigration() {
    try {
        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

        if (error) {
            console.error('Migration error:', error);
            console.log('\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
            console.log(migrationSQL);
            process.exit(1);
        }

        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('Error:', err.message);
        console.log('\n📝 Please run this SQL in Supabase SQL Editor:');
        console.log(migrationSQL);
        process.exit(1);
    }
}

runMigration();
