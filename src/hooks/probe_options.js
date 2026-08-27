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

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY

async function run() {
  const url = `${supabaseUrl}/rest/v1/inventory`
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'docs=openapi',
        'Accept': 'application/openapi+json'
      }
    })
    console.log('Status:', response.status)
    const text = await response.text()
    console.log('Response Body:', text)
  } catch (err) {
    console.error('Failed OPTIONS request:', err)
  }
}

run()
