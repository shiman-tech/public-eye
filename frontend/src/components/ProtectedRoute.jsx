import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
    const [session, setSession] = useState(undefined)

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
        return () => listener.subscription.unsubscribe()
    }, [])

    if (session === undefined) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
        )
    }

    return session ? children : <Navigate to="/login" replace />
}
