'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// ssr: false is ONLY allowed inside a 'use client' file — never in a Server Component
const EditorWorkspaceClient = dynamic(
    () => import('./EditorWorkspaceClient').then((m) => m.EditorWorkspaceClient),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-mono font-medium">Preparing Editor...</p>
                </div>
            </div>
        ),
    }
)

export default function EditorWrapper({ noteId }: { noteId: string }) {
    return <EditorWorkspaceClient noteId={noteId} />
}
