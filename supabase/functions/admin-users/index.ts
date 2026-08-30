import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const token = req.headers.get('Authorization') || ''
    const caller = createClient(url, anon, { global: { headers: { Authorization: token } } })
    const { data: { user } } = await caller.auth.getUser()
    if (!user) throw new Error('Authentication required')
    const admin = createClient(url, service)
    const { data: profile } = await admin.from('profiles').select('role:roles(name)').eq('id', user.id).single()
    if (profile?.role?.name?.toLowerCase() !== 'admin') throw new Error('Admin permission required')
    const body = await req.json()
    let result
    if (body.action === 'list') {
      const { data: users, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }); if (error) throw error
      const { data: profiles, error: pe } = await admin.from('profiles').select('*, role:roles(name)'); if (pe) throw pe
      result = users.map((u) => { const p = profiles.find((x) => x.id === u.id) || {}; return { ...p, id: u.id, email: u.email, created_at: u.created_at, role: p.role?.name?.toLowerCase(), name: p.full_name, status: p.is_active ? 'active' : 'inactive' } })
    } else if (body.action === 'create' || body.action === 'update') {
      const roleName = body.role === 'admin' ? 'Admin' : body.role === 'manager' ? 'Manager' : 'Cashier'
      const { data: role, error: re } = await admin.from('roles').select('id').ilike('name', roleName).single(); if (re) throw re
      if (body.action === 'create') {
        const { data, error } = await admin.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { name: body.name } }); if (error) throw error
        const { error: pe } = await admin.from('profiles').upsert({ id: data.user.id, full_name: body.name, phone: body.mobile, role_id: role.id, is_active: (body.status || 'active') === 'active' }); if (pe) throw pe; result = { id: data.user.id }
      } else {
        const attrs = { email: body.email, user_metadata: { name: body.name }, ...(body.password ? { password: body.password } : {}) }
        const { error } = await admin.auth.admin.updateUserById(body.id, attrs); if (error) throw error
        const { error: pe } = await admin.from('profiles').update({ full_name: body.name, phone: body.mobile, role_id: role.id, is_active: body.status === 'active' }).eq('id', body.id); if (pe) throw pe; result = { id: body.id }
      }
    } else if (body.action === 'delete') {
      if (body.id === user.id) throw new Error('You cannot delete your own account')
      const { error } = await admin.auth.admin.deleteUser(body.id); if (error) throw error; result = { id: body.id }
    } else throw new Error('Unknown action')
    return new Response(JSON.stringify({ data: result }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (error) { return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }) }
})
