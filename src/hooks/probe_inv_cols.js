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

async function testInventory() {
  console.log('--- Testing Inventory Column Names ---')
  const candidates = [
    { product_id: '00000000-0000-0000-0000-000000000000', quantity: 10, min: 5 },
    { product_id: '00000000-0000-0000-0000-000000000000', quantity: 10, reorder: 5 },
    { product_id: '00000000-0000-0000-0000-000000000000', quantity: 10, min: 5, reorder: 8 }
  ]
  for (const c of candidates) {
    const { error } = await supabase.from('inventory').insert([c])
    if (error) {
      console.log(`Inventory ${JSON.stringify(c)}: Error: ${error.message}`)
    } else {
      console.log(`Inventory ${JSON.stringify(c)}: SUCCESS!`)
      await supabase.from('inventory').delete().eq('product_id', c.product_id)
    }
  }
}

testInventory()
