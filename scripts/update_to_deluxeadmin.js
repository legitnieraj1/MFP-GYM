const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateToDeluxeAdmin() {
    const email = "daluxeadmin@gmail.com";
    console.log(`Updating role for: ${email}`);

    // 1. Get Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User not found via listUsers. (Should not happen if previous script found it)");
        return;
    }

    // 2. Update Public Profile
    // Note: This relies on the check constraint being updated first!
    const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'DALUXEADMIN' })
        .eq('id', user.id);

    if (updateError) {
        console.error("Update FAILED:", updateError);
        console.log("(Did you run the SQL migration to allow 'DALUXEADMIN' in check constraint?)");
    } else {
        console.log("SUCCESS: User role updated to DALUXEADMIN");
    }
}

updateToDeluxeAdmin();
