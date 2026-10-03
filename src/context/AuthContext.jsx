import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase/supabase'
import { getCurrentProfile, invalidateCache } from '../services/erpService'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [session,setSession]=useState(null), [profile,setProfile]=useState(null), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const stateRef = useRef({ session: null, profile: null })
  useEffect(() => {
    stateRef.current = { session, profile }
  }, [session, profile])

  useEffect(()=>{ let active=true
    let revision = 0
    let authEventReceived = false
    let authTimer
    async function apply(next){
      if(!active)return;
      const requestRevision = ++revision
      const current = stateRef.current
      const prevUserId = current.session?.user?.id
      const nextUserId = next?.user?.id

      if (prevUserId === nextUserId && current.profile) {
        setSession(next)
        return
      }

      setSession(next); setProfile(null); setError(''); setLoading(Boolean(next))
      if(next){
        try {
          const nextProfile = await getCurrentProfile()
          if (!active || requestRevision !== revision) return
          stateRef.current = { session: next, profile: nextProfile }
          setProfile(nextProfile)
        } catch(e) {
          if (!active || requestRevision !== revision) return
          setError(e.message)
        }
      }
      if (active && requestRevision === revision) setLoading(false)
    }
    supabase.auth.getSession().then(({data,error:e})=>{ if(!active || authEventReceived)return; if(e){setError(e.message);setLoading(false)}else apply(data.session) }).catch(e=>{if(active && !authEventReceived){setError(e.message);setLoading(false)}})
    // Supabase must finish notifying auth listeners before another auth request starts.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{
      authEventReceived = true
      ++revision
      clearTimeout(authTimer)
      authTimer = setTimeout(() => { void apply(next) }, 0)
    })
    return()=>{active=false;clearTimeout(authTimer);subscription.unsubscribe()}
  },[])
  async function signIn(email,password){ 
    const {error:e}=await supabase.auth.signInWithPassword({email,password}); 
    if(e)throw new Error(e.message);
    invalidateCache('all');
    try { sessionStorage.setItem('erp_just_logged_in', 'true') } catch (_) {}
  }
  async function signOut(){ 
    try { sessionStorage.removeItem('erp_just_logged_in') } catch (_) {}
    const {error:e}=await supabase.auth.signOut(); 
    if(e)throw new Error(e.message) 
  }
  return <AuthContext.Provider value={{session,user:session?.user||null,profile,role:profile?.role||null,loading,error,signIn,signOut}}>{children}</AuthContext.Provider>
}
export function useAuth(){ const value=useContext(AuthContext); if(!value)throw new Error('useAuth must be inside AuthProvider'); return value }
