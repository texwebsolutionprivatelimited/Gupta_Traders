import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabase/supabase'
import { getCurrentProfile } from '../services/erpService'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session,setSession]=useState(null), [profile,setProfile]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('')
  useEffect(()=>{ let active=true
    async function apply(next){ if(!active)return; setSession(next); setProfile(null); setError(''); if(next){ try{setProfile(await getCurrentProfile())}catch(e){setError(e.message)} } setLoading(false) }
    supabase.auth.getSession().then(({data,error:e})=>{ if(e){setError(e.message);setLoading(false)}else apply(data.session) })
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>apply(next)); return()=>{active=false;subscription.unsubscribe()}
  },[])
  async function signIn(email,password){ const {error:e}=await supabase.auth.signInWithPassword({email,password}); if(e)throw new Error(e.message) }
  async function signOut(){ const {error:e}=await supabase.auth.signOut(); if(e)throw new Error(e.message) }
  return <AuthContext.Provider value={{session,user:session?.user||null,profile,role:profile?.role||null,loading,error,signIn,signOut}}>{children}</AuthContext.Provider>
}
export function useAuth(){ const value=useContext(AuthContext); if(!value)throw new Error('useAuth must be inside AuthProvider'); return value }
