import { createClient } from '@supabase/supabase-js';

const url = "https://hubkwazaplkzwpexpudb.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1Ymt3YXphcGxrendwZXhwdWRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDc0MTU4MywiZXhwIjoyMDg2MzE3NTgzfQ.u-mpVyYhkgEy1ayiomoG-HegAfwAKPYO5nyZapkbHsc";

const supabase = createClient(url, key);

async function main() {
    console.log("Checking buckets...");
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error("Error listing buckets:", error);
        return;
    }

    console.log("Existing buckets:", buckets.map(b => b.name));

    const bucketName = "member-photos";
    if (!buckets.find(b => b.name === bucketName)) {
        console.log(`Bucket '${bucketName}' not found. Creating...`);
        const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
            fileSizeLimit: 10485760 // 10MB
        });

        if (createError) {
            console.error("Error creating bucket:", createError);
        } else {
            console.log("Bucket created successfully:", data);
        }
    } else {
        console.log(`Bucket '${bucketName}' already exists.`);

        // Ensure it's public
        const bucket = buckets.find(b => b.name === bucketName);
        if (!bucket.public) {
            console.log(`Bucket '${bucketName}' is not public. Updating...`);
            const { data, error: updateError } = await supabase.storage.updateBucket(bucketName, {
                public: true
            });
            if (updateError) {
                console.error("Error updating bucket:", updateError);
            } else {
                console.log("Bucket updated to public:", data);
            }
        } else {
            console.log(`Bucket '${bucketName}' is already public.`);
        }
    }
}

main();
