import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    return (
        <Suspense fallback={
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <DashboardClient user={user} />
        </Suspense>
    )
}
