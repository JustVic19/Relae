
import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging
const supabaseUrl = 'https://kikaavafovalupmhzmpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpa2FhdmFmb3ZhbHVwbWh6bXBjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ1MzE2NSwiZXhwIjoyMDgyMDI5MTY1fQ.5mMSd4X2TbEVpvh4veb0Ao35YndzlknzaQhvoHjN0ps';

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrations() {
    console.log('Fetching all integrations...');
    // Just get all integrations to see what's there
    const { data, error } = await supabase
        .from('email_integrations')
        .select('*');

    if (error) {
        console.error('Error fetching integrations:', error);
        return;
    }

    console.log('Total integrations found:', data?.length);
    data?.forEach(i => {
        console.log(`JSON: ${JSON.stringify(i)}`);
    });
}

checkIntegrations();
