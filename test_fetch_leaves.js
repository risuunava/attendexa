import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetchLeaves() {
  console.log("Trying users!leave_requests_user_id_fkey...");
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      id, user_id, type, start_date, end_date, reason, attachment_url, status, created_at,
      users!leave_requests_user_id_fkey(full_name, department)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error with fkey name:', error.message)
  } else {
    console.log('Success with fkey name')
  }

  console.log("Trying users!leave_requests_reviewed_by_fkey...");
  const { data: data2, error: err2 } = await supabase
    .from('leave_requests')
    .select(`
      id, user_id, type, start_date, end_date, reason, attachment_url, status, created_at,
      users!leave_requests_reviewed_by_fkey(full_name, department)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (err2) {
    console.error('Error with fkey name 2:', err2.message)
  } else {
    console.log('Success with fkey name 2')
  }
}

testFetchLeaves()
