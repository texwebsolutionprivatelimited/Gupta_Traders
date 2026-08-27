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

async function checkTable(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1)
  if (error) {
    if (error.code === '42P01') {
      console.log(`Table "${tableName}" does NOT exist in Supabase.`)
    } else {
      console.log(`Table "${tableName}" exists! (Error check: ${error.message})`)
    }
  } else {
    console.log(`Table "${tableName}" exists! Count: ${data.length}`)
  }
}

async function run() {
  const potentialTables = [
    'sales', 'purchases', 'inventory_logs', 'transactions', 'bills', 
    'sales_history', 'purchase_history', 'inventory', 'stock_adjustments'
  ]
  for (const table of potentialTables) {
    await checkTable(table)
  }
}

run()
