import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
async function test() {
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'products' }) // probably won't work
  
  // Let's just try to insert one and see if 'brand_id' exists, but I can also just fetch using PostgreSQL information schema using postgres connection string. Wait, I don't have the postgres string.
}
test()
