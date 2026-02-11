const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
    const email = "nierajfreestyle@gmail.com";
    const password = "nieraj 123";

    console.log(`Attempting login for: ${email} with password: '${password}'`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error("Login FAILED:", error.message);
        console.error("Error details:", error);
    } else {
        console.log("Login SUCCESS!");
        console.log("User ID:", data.user.id);
        console.log("Email:", data.user.email);

        // Double check role via public table? 
        // We can't access public table with anon key if RLS enabled and policy only allows "own" read?
        // Wait, standard users can read their own profile.

        // Let's try to read the profile to see if RLS works and role is visible
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            console.error("Could not fetch profile (RLS?):", profileError.message);
        } else {
            console.log("Profile Role:", profile.role);
        }
    }
}

testLogin();
