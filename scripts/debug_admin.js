const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAdmin() {
    const email = "nierajfreestyle@gmail.com";

    console.log(`Checking user: ${email} using Service Role...`);

    // 1. Check Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
        console.error("Auth Fetch Error:", authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User NOT FOUND in Auth!");
        return;
    }

    console.log("Auth User Found:", user.id);

    // 2. Check Public Profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id);

    if (profileError) {
        console.error("Profile Fetch Error:", profileError);
    } else {
        console.log("Public Profile Data:", profile);
        if (profile.length === 0) {
            console.log("WARNING: User exists in Auth but NOT in public.users table.");
        } else if (profile.length > 1) {
            console.log("WARNING: Multiple profiles found for one user ID!");
        } else {
            console.log("Role:", profile[0].role);
            if (profile[0].role !== 'ADMIN') {
                console.log("Action: Promoting to ADMIN...");
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ role: 'ADMIN' })
                    .eq('id', user.id);

                if (updateError) console.error("Update failed:", updateError);
                else console.log("Update SUCCESS. User is now ADMIN.");
            } else {
                console.log("User is already ADMIN.");
            }
        }
    }
}

debugAdmin();
