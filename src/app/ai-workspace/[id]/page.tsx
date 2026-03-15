import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AiWorkspaceClient from './AiWorkspaceClient'

export default async function AiWorkspace({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const resolvedParams = await params
    const noteId = resolvedParams.id

    return <AiWorkspaceClient noteId={noteId} />
}
