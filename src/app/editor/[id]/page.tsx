import EditorWrapper from '@/components/editor/EditorWrapper'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EditorPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { id: noteId } = await params
    return <EditorWrapper noteId={noteId} />
}
