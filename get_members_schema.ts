import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabaseAdmin.from('members').select('*').limit(1);
    console.log(data, error);
}

run();
