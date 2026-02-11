const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminProfile() {
    const email = "nierajfreestyle@gmail.com";
    console.log(`Fixing profile for: ${email}`);

    // 1. Get Auth User
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError || !users) {
        console.error("Auth Fetch Error:", authError);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error("User NOT FOUND in Auth! Please sign up first.");
        return;
    }

    console.log(`Auth User ID: ${user.id}`);

    // 2. Check if profile exists
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116

    if (profile) {
        console.log("Profile exists. Role:", profile.role);
        if (profile.role !== 'ADMIN') {
            console.log("Updating role to ADMIN...");
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'ADMIN' })
                .eq('id', user.id);
            if (updateError) console.error("Update Failed:", updateError);
            else console.log("Role updated to ADMIN.");
        } else {
            console.log("User is already ADMIN.");
        }
    } else {
        console.log("Profile MISSING. Creating new ADMIN profile...");
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || "Admin User",
                role: 'ADMIN',
                // Add dummy required fields if any (schema allows nulls for most?)
                // Schema: age int, weight float, height float... 
                // Let's check schema.sql... age/weight/height are nullable.
            });

        if (insertError) {
            console.error("Insert Failed:", insertError);
        } else {
            console.log("Profile created successfully with ADMIN role.");
        }
    }
}

fixAdminProfile();
