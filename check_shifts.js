import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: userShifts, error: err1 } = await supabase.from('user_shifts').select('*')
  console.log('user_shifts:', userShifts, err1)
  
  const { data: shifts, error: err2 } = await supabase.from('shifts').select('*')
  console.log('shifts:', shifts, err2)
}

check()
