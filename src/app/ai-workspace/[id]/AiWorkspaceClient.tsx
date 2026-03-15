'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, GitCompare, Check, Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AiWorkspaceClient({ noteId }: { noteId: string }) {
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(true)
    const [originalContent, setOriginalContent] = useState('')
    const [enhancedContent, setEnhancedContent] = useState('')

    useEffect(() => {
        const fetchNote = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('notes')
                .select('original_content, ai_enhanced_content')
                .eq('id', noteId)
                .single()

            if (error || !data) {
                toast.error('Note not found')
                router.push('/dashboard')
            } else {
                setOriginalContent(data.original_content || '')
                setEnhancedContent(data.ai_enhanced_content || '')
                setIsLoading(false)
            }
        }

        fetchNote()
    }, [noteId, router])

    const handleCopy = () => {
        if (!enhancedContent) return
        navigator.clipboard.writeText(enhancedContent)
        toast.success('Copied to clipboard')
    }

    const handleReplace = async () => {
        if (!enhancedContent) return

        const toastId = toast.loading('Replacing content...')
        const supabase = createClient()

        const { error } = await supabase
            .from('notes')
            .update({
                original_content: enhancedContent,
                ai_enhanced_content: null
            })
            .eq('id', noteId)

        if (error) {
            toast.error('Failed to update note', { id: toastId })
        } else {
            toast.success('Note updated successfully', { id: toastId })
            router.push(`/editor/${noteId}`)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background notebook-grid">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-mono font-medium tracking-tight">Loading Version Compare...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen p-4 md:p-8 animate-in fade-in duration-500 bg-background notebook-grid">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b-2 border-primary/20 bg-card/80 p-4 rounded-sm shadow-[4px_4px_0_rgba(0,0,0,0.05)] backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/editor/${noteId}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5 text-primary" />
                        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>Version Compare</h1>
                    </div>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <Button variant="outline" onClick={handleCopy} disabled={!enhancedContent} className="border-2 border-foreground/20 font-bold hover:border-primary">
                        <Copy className="h-4 w-4 mr-2" /> Copy Enhanced
                    </Button>
                    <Button onClick={handleReplace} disabled={!enhancedContent} className="border-2 border-primary shadow-[2px_2px_0_var(--color-primary)] font-bold">
                        <Check className="h-4 w-4 mr-2" /> Accept & Replace
                    </Button>
                </div>
            </div>

            {/* Split Comparison View */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden max-w-[1600px] w-full mx-auto">
                {/* Original Column */}
                <div className="flex flex-col h-full relative">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-2 bg-destructive/10 text-destructive border-2 border-destructive px-3 py-1 text-sm font-bold shadow-[2px_2px_0_var(--color-destructive)] rounded-sm rotate-3 z-10">
                        Original
                    </div>
                    <div className="flex-1 bg-card/50 border-2 border-foreground/10 rounded-sm overflow-hidden p-6 text-foreground/70 font-medium whitespace-pre-wrap overflow-y-auto font-mono text-sm leading-relaxed">
                        {originalContent || 'No original content available.'}
                    </div>
                </div>

                {/* Enhanced Column */}
                <div className="flex flex-col h-full relative">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-2 bg-primary/10 text-primary border-2 border-primary px-3 py-1 text-sm font-bold shadow-[2px_2px_0_var(--color-primary)] rounded-sm -rotate-2 z-10">
                        ✨ AI Enhanced
                    </div>
                    <div className="flex-1 bg-card border-2 border-primary/30 rounded-sm overflow-hidden p-6 text-foreground font-medium whitespace-pre-wrap overflow-y-auto shadow-[8px_8px_0_rgba(171,206,212,0.15)] ring-1 ring-primary/20 font-mono text-sm leading-relaxed">
                        {enhancedContent || 'Generating AI version or none available...'}
                    </div>
                </div>
            </div>
        </div>
    )
}
