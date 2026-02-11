const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDeluxeAdmin() {
    const email = "DALUXEADMIN@GMAIL.COM"; // Check case sensitivity if needed, usually lowercase in auth

    console.log(`Checking user: ${email} using Service Role...`);

    // 1. Check Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Auth Fetch Error:", authError);
        return;
    }

    // Auth emails are usually stored lowercase
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        console.error("User NOT FOUND in Auth!");
        console.log("Available emails:", users.map(u => u.email));
        return;
    }

    console.log("Auth User Found:", user.id);
    console.log("Auth Email:", user.email);

    // 2. Check Public Profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);

    if (profileError) {
        console.error("Profile Fetch Error:", profileError);
    } else {
        console.log("Public Profile Data:", profile);
        if (profile.length > 0) {
            console.log("Current Role:", profile[0].role);
        } else {
            console.log("No profile found in public.users table.");
        }
    }
}

debugDeluxeAdmin();
