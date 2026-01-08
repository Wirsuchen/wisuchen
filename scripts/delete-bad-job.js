/**
 * Script to find jobs in Deutschland and list all of them
 * Run with: node scripts/delete-bad-job.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ngvuyarcqezvugfqfopg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnV5YXJjcWV6dnVnZnFmb3BnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg0MzgxMSwiZXhwIjoyMDczNDE5ODExfQ.CqD78gdpvwEvRM66tHIAiMJIZm_ObRzhBDUFdHJfHvE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAndFindBadJobs() {
  console.log('🔍 Listing all jobs to find the corrupted one...\n');

  // Get all jobs
  const { data: jobs, error: findError } = await supabase
    .from('offers')
    .select('id, title, location, source, published_at')
    .eq('type', 'job')
    .order('published_at', { ascending: false })
    .limit(50);

  if (findError) {
    console.error('❌ Error finding jobs:', findError);
    process.exit(1);
  }

  if (!jobs || jobs.length === 0) {
    console.log('⚠️ No jobs found in database');
    process.exit(0);
  }

  console.log(`� Found ${jobs.length} jobs in database:\n`);
  
  const suspiciousJobs = [];
  
  jobs.forEach((job, i) => {
    const titleLength = job.title?.length || 0;
    const isSuspicious = titleLength > 100 || 
                         job.title?.toLowerCase().includes('general information') ||
                         job.title?.toLowerCase().includes('join the teams') ||
                         job.title?.toLowerCase().includes('we support');
    
    if (isSuspicious) {
      suspiciousJobs.push(job);
    }
    
    console.log(`${i + 1}. [${isSuspicious ? '⚠️ SUSPICIOUS' : '✓'}] ID: ${job.id}`);
    console.log(`   Title: ${job.title?.substring(0, 100)}${titleLength > 100 ? '...' : ''}`);
    console.log(`   Location: ${job.location}`);
    console.log(`   Title Length: ${titleLength} chars`);
    console.log('');
  });

  if (suspiciousJobs.length > 0) {
    console.log(`\n🎯 Found ${suspiciousJobs.length} suspicious job(s) to delete:\n`);
    
    for (const job of suspiciousJobs) {
      console.log(`Deleting: ${job.id} - "${job.title?.substring(0, 50)}..."`);
      
      // Delete impressions first
      await supabase.from('impressions').delete().eq('offer_id', job.id);
      
      // Delete translations
      await supabase.from('translations').delete().ilike('content_id', `%${job.id}%`);
      
      // Delete the job
      const { error } = await supabase.from('offers').delete().eq('id', job.id);
      
      if (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      } else {
        console.log(`  ✅ Deleted successfully`);
      }
    }
  } else {
    console.log('\n✅ No suspicious jobs found');
  }
}

listAndFindBadJobs();
