const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdmin() {
    const email = "nierajfreestyle@gmail.com";
    const password = "nieraj 123"; // Updating password to ensure it matches what user expects

    console.log(`Fixing admin user: ${email}`);

    // 1. Get Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error("Error listing users:", listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);
    let userId;

    if (existingUser) {
        console.log("Auth user found.");
        userId = existingUser.id;

        // Optional: Reset password to be sure (since they mentioned it)
        const { error: pwdError } = await supabase.auth.admin.updateUserById(userId, {
            password: password,
            email_confirm: true
        });
        if (pwdError) console.error("Error updating password:", pwdError);
        else console.log("Password synced.");

    } else {
        console.log("Auth user NOT found. Creating...");
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: "Nieraj" }
        });

        if (error) {
            console.error("Error creating user:", error);
            return;
        }
        userId = data.user.id;
        console.log("Auth user created.");
    }

    // 2. Fix public.users table
    console.log(`Checking public.users table for ID: ${userId}...`);

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (profile) {
        console.log(`Profile found. Current role: ${profile.role}`);
        if (profile.role !== 'ADMIN') {
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: 'ADMIN' })
                .eq('id', userId);

            if (updateError) console.error("Error updating role:", updateError);
            else console.log("SUCCESS: Role updated to ADMIN.");
        } else {
            console.log("Role is already ADMIN. Setup looks correct.");
        }
    } else {
        console.log("Profile NOT found in public.users. Creating it...");
        const { error: insertError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: email,
                name: "Nieraj",
                role: 'ADMIN',
                phone: '0000000000',
                age: 25,
                weight: 70,
                height: 175
            });

        if (insertError) console.error("Error creating profile:", insertError);
        else console.log("SUCCESS: Profile created with ADMIN role.");
    }
}

fixAdmin();
