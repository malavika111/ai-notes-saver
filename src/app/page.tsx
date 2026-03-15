import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import LandingContent from './LandingContent'
import { Loader2 } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  // No longer redirecting authenticated users to /dashboard
  // This allows them to view the landing page if they choose

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <LandingContent />
    </Suspense>
  )
}
