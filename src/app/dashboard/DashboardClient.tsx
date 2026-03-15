'use client'

import { useState, useEffect, useMemo } from 'react'
import { NoteCard } from '@/components/dashboard/NoteCard'
import { Search, FolderOpen, PenSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function DashboardClient({ user }: { user: User }) {
    const searchParams = useSearchParams()
    const folderId = searchParams.get('folder')
    const [searchQuery, setSearchQuery] = useState('')
    const [notes, setNotes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchNotes = async () => {
            setIsLoading(true)
            const supabase = createClient()

            let query = supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (folderId) {
                query = query.eq('folder_id', folderId)
            }

            const { data, error } = await query

            if (data) {
                setNotes(data)
            } else if (error) {
                console.error("Error fetching notes:", error)
                toast.error(`Error loading notes: ${error.message}`)
            }
            setIsLoading(false)
        }

        fetchNotes()
    }, [folderId, user.id])

    const filteredNotes = useMemo(() => {
        if (!searchQuery) return notes;
        const lowerQuery = searchQuery.toLowerCase();
        return notes.filter(note =>
            (note.title && note.title.toLowerCase().includes(lowerQuery)) ||
            (note.original_content && note.original_content.toLowerCase().includes(lowerQuery))
        );
    }, [searchQuery, notes])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        )
    }

    return (
        <div className="space-y-12 pb-20 relative">
            <div className="flex items-center justify-between border-b-2 border-foreground/5 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-foreground/20" />
                        {folderId ? 'Folder Notes' : 'My Notebook'}
                    </h1>
                    <p className="text-foreground/40 font-bold ml-11">
                        {notes.length} notes total
                    </p>
                </div>
                <Link href="/editor/new">
                    <Button variant="sketch" className="h-12 px-6 font-bold text-lg group">
                        <PenSquare className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                        New Note
                    </Button>
                </Link>
            </div>

            {/* Floating Action Button for Mobile or just extra utility */}
            <div className="fixed bottom-10 right-10 z-50">
                <Link href="/editor/new">
                    <Button variant="sketch" className="size-16 rounded-full shadow-xl hover:scale-110 transition-transform">
                        <PenSquare className="h-8 w-8" />
                    </Button>
                </Link>
            </div>

            {notes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-foreground/20 rounded-md bg-card/30">
                    <p className="text-foreground font-bold text-2xl mb-6" style={{ fontFamily: 'var(--font-mono)' }}>Create your first note</p>
                    <Link href="/editor/new">
                        <Button className="font-bold border-2 border-primary shadow-[2px_2px_0_var(--color-primary)] hover:translate-y-[1px] hover:translate-x-[1px] transition-all px-8 py-6 text-lg">
                            <span className="text-2xl mr-2">+</span> New Note
                        </Button>
                    </Link>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-foreground/20 rounded-md bg-card/30">
                    <p className="text-muted-foreground font-medium text-lg mb-4">No notes found for "{searchQuery}"</p>
                    <Button variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredNotes.map(note => (
                        <NoteCard
                            key={note.id}
                            id={note.id}
                            title={note.title || 'Untitled Note'}
                            preview={(note.original_content || '').substring(0, 150)}
                            updatedAt={new Date(note.created_at).toLocaleDateString()}
                            hasAiEnhanced={!!note.ai_enhanced_content}
                            onRefresh={() => {
                                // Trigger refetch in useEffect by changing a dummy state or just calling fetcher if available
                                // Actually, I'll just reload the page for now as it's the simplest "refresh"
                                window.location.reload()
                            }}
                        />
                    ))}
                    {searchQuery === '' && (
                        <Link href="/editor/new">
                            <div className="h-64 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-foreground/20 rounded-md text-foreground/50 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all">
                                <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center mb-2">
                                    <span className="text-4xl font-light mb-1">+</span>
                                </div>
                                <span className="font-bold font-mono">Create new note</span>
                            </div>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
