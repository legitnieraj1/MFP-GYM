const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setAdmin() {
    const email = "admin@mfpgym.com";
    const password = "romanprabhurmfp";
    const name = "Roman Prabhur";

    console.log(`Setting up admin user: ${email}`);

    // 1. Check if user exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log("User exists, updating password...");
        const { data, error } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: password,
            user_metadata: { name: name }
        });

        if (error) {
            console.error("Error updating password:", error);
            return;
        }
        userId = existingUser.id;
        console.log("Password updated.");
    } else {
        console.log("User does not exist, creating...");
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: name }
        });

        if (error) {
            console.error("Error creating user:", error);
            return;
        }
        userId = data.user.id;
        console.log("User created.");
    }

    // 2. Ensure user is in public.users and has ADMIN role
    console.log("Ensuring public profile and ADMIN role...");

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        const { error: updateError } = await supabase
            .from('users')
            .update({ role: 'ADMIN', name: name })
            .eq('id', userId);

        if (updateError) console.error("Error updating role:", updateError);
        else console.log("Role updated to ADMIN.");
    } else {
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: email,
                name: name,
                role: 'ADMIN',
                phone: '0000000000', // Dummy
                age: 30,
                weight: 80,
                height: 180
            });

        if (insertError) console.error("Error creating profile:", insertError);
        else console.log("Profile created with ADMIN role.");
    }

    console.log("Done! You can now log in at /admin/login");
}

setAdmin();
