import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envText = fs.readFileSync('.env', 'utf8')
const env = {}
envText.split('\n').forEach(line => {
  const parts = line.split('=')
  if (parts.length >= 2) {
    const key = parts[0].trim()
    const value = parts.slice(1).join('=').trim()
    env[key] = value
  }
})

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)

async function testInsert(tableName) {
  console.log(`\n--- Testing Insert for table: ${tableName} ---`)
  const { data, error } = await supabase.from(tableName).insert([{}]).select()
  if (error) {
    console.log(`Error message: ${error.message}`)
    console.log(`Error code: ${error.code}`)
    console.log(`Error details:`, error.details)
  } else {
    console.log(`Success! Inserted row:`, data)
    if (data[0] && data[0].id) {
      await supabase.from(tableName).delete().eq('id', data[0].id)
    }
  }
}

async function run() {
  await testInsert('sale_items')
  await testInsert('purchase_items')
}

run()
