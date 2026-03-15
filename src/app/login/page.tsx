import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LoginContent from './LoginContent'
import { Loader2 } from 'lucide-react'

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        redirect('/dashboard')
    }

    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-4 notebook-grid relative overflow-hidden">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
