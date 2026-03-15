'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor').then(mod => mod.RichTextEditor), { ssr: false })
import { UploadPanel } from '@/components/editor/UploadPanel'
import { AISidebar } from '@/components/editor/AISidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { jsPDF } from 'jspdf'
import { toPng } from 'html-to-image'
import { Download, FileText, Type as TypeIcon, FileJson, ChevronDown, Sparkles, Replace } from 'lucide-react'
import { cleanAIText } from '@/lib/utils'

interface EditorWorkspaceProps {
    noteId: string
}

export function EditorWorkspaceClient({ noteId }: EditorWorkspaceProps) {
    const isNew = noteId === 'new'
    const router = useRouter()

    const [isLoading, setIsLoading] = useState(!isNew)
    const [title, setTitle] = useState(isNew ? 'Untitled Note' : 'Loading...')
    const [content, setContent] = useState('')
    const [enhancedContent, setEnhancedContent] = useState('')
    const [editor, setEditor] = useState<any>(null)
    const [isExportOpen, setIsExportOpen] = useState(false)

    useEffect(() => {
        if (isNew) {
            setIsLoading(false)
            return
        }

        const fetchNote = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('id', noteId)
                .single()

            if (error || !data) {
                console.error('Error fetching note:', error)
                toast.error('Note not found')
                router.push('/dashboard')
            } else {
                setTitle(data.title || 'Untitled Note')
                const initialContent = data.original_content || ''
                setContent(initialContent)
                const enhanced = data.ai_enhanced_content ? cleanAIText(data.ai_enhanced_content) : ''
                setEnhancedContent(enhanced)
                setIsLoading(false)
            }
        }

        fetchNote()
    }, [isNew, noteId, router])

    const handleSave = async (updatedContent: string) => {
        setContent(updatedContent)
    }

    const handleManualSave = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            toast.error('You must be logged in to save.')
            return
        }

        // Always capture latest content from editor or fallback
        const currentContent = editor?.getHTML?.() || content
        
        console.log("Saving note:", { noteId, userId: user.id })
        const toastId = toast.loading('Saving note...')

        try {
            if (isNew) {
                const { data, error } = await supabase
                    .from('notes')
                    .insert([{ 
                        user_id: user.id, 
                        title, 
                        original_content: currentContent 
                    }])
                    .select()
                    .single()

                if (error) {
                    console.error("Supabase save error:", JSON.stringify(error, null, 2))
                    toast.error('Failed to save note.', { id: toastId })
                } else {
                    toast.success('Note created!', { id: toastId })
                    router.push(`/editor/${data.id}`)
                }
            } else {
                const { error } = await supabase
                    .from('notes')
                    .update({ 
                        title, 
                        original_content: currentContent
                    })
                    .eq('id', noteId)

                if (error) {
                    console.error("Supabase save error:", JSON.stringify(error, null, 2))
                    toast.error('Failed to save note.', { id: toastId })
                } else {
                    toast.success('Note saved!', { id: toastId })
                }
            }
        } catch (error) {
            console.error("Unexpected save error:", error)
            toast.error("Failed to save note", { id: toastId })
        }
    }

    /*
    NEW SYSTEM:
    We no longer insert Supabase file URLs.
    Instead we insert the extracted text returned from the API.
    */

    const handleFileUpload = (data: { fileName: string; text: string }) => {
        if (!editor) {
            toast.error('Editor not ready')
            return
        }

        const formatted = `

## Imported File: ${data.fileName}

${data.text}

---

`

        editor
            .chain()
            .focus('end')
            .insertContent(formatted)
            .run()
    }

    const exportToPDF = async () => {
        if (!editor) return;
        const toastId = toast.loading('Generating PDF...')
        try {
            const element = document.querySelector('.tiptap.prose') as HTMLElement;
            if (!element) throw new Error('Editor content not found');

            const dataUrl = await toPng(element, { backgroundColor: '#fff', quality: 0.95 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);
            toast.success('PDF exported!', { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error('Failed to export PDF', { id: toastId });
        }
        setIsExportOpen(false)
    }

    const exportToMarkdown = () => {
        if (!editor) return;
        const content = editor.getText();
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportOpen(false)
        toast.success('Markdown exported!')
    }

    const exportToTxt = () => {
        if (!editor) return;
        const content = editor.getText();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportOpen(false)
        toast.success('Plain Text exported!')
    }

    const handleAiReplace = (newContent: string) => {
        if (!editor) return
        const cleaned = cleanAIText(newContent)
        editor.commands.setContent(cleaned)
        toast.success('Note content replaced')
    }

    const handleAiAppend = (addedContent: string) => {
        if (!editor) return
        const cleaned = cleanAIText(addedContent)
        editor.chain()
            .focus('end')
            .insertContent('\n\n--- AI Generated ---\n\n' + cleaned)
            .run()
        toast.success('AI content appended to note')
    }

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-8rem)] items-center justify-center animate-in fade-in duration-500">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground font-mono font-medium">Loading Note...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-foreground/10 border-dashed">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 font-mono tracking-tight"
                    />
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button 
                            variant="outline"
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="h-9 border-foreground/20 hover:border-primary transition-all"
                        >
                            <Download className="h-4 w-4 mr-2" /> Export <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
                        </Button>
                        
                        {isExportOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card border-2 border-foreground/15 shadow-[4px_4px_0_rgba(0,0,0,0.1)] rounded-sm z-50 overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                                <button 
                                    onClick={exportToPDF}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 flex items-center gap-2 transition-colors border-b border-foreground/5"
                                >
                                    <FileText className="h-4 w-4 text-primary" /> Export as PDF
                                </button>
                                <button 
                                    onClick={exportToMarkdown}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 flex items-center gap-2 transition-colors border-b border-foreground/5"
                                >
                                    <FileJson className="h-4 w-4 text-primary" /> Export as Markdown (.md)
                                </button>
                                <button 
                                    onClick={exportToTxt}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-primary/10 flex items-center gap-2 transition-colors"
                                >
                                    <TypeIcon className="h-4 w-4 text-primary" /> Export as Plain Text (.txt)
                                </button>
                            </div>
                        )}
                    </div>

                    <Button onClick={handleManualSave} className="h-9 shadow-[2px_2px_0_var(--color-primary)] hover:translate-y-[1px] hover:translate-x-[1px] transition-all">
                        <Save className="h-4 w-4 mr-2" /> Save Note
                    </Button>
                </div>
            </div>

            <div className={`flex flex-1 gap-6 overflow-hidden mt-2 ${enhancedContent ? 'grid grid-cols-[1fr_1fr_320px]' : 'grid grid-cols-[1fr_320px]'}`}>
                {/* Left Column: Upload + Editor */}
                <div className="flex flex-col gap-4 overflow-hidden h-full pr-2">
                    <div className="flex-none">
                        <UploadPanel onFileUpload={handleFileUpload} noteId={noteId} />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
                        <RichTextEditor initialContent={content} onSave={handleSave} onEditorReady={setEditor} />
                    </div>
                </div>

                {/* Middle Column: AI Preview (Conditional) */}
                {enhancedContent && (
                    <div className="flex flex-col border-2 border-primary/20 bg-primary/5 rounded-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 h-full">
                        <div className="flex-none items-center justify-between p-3 border-b-2 border-primary/10 bg-primary/10 flex">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="font-bold text-sm uppercase tracking-wider text-primary">AI Enhanced Preview</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setEnhancedContent('')} className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600">
                                <ArrowLeft className="h-4 w-4 rotate-90" />
                            </Button>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium custom-scrollbar">
                            {enhancedContent}
                        </div>

                        <div className="flex-none p-4 border-t-2 border-primary/10 bg-primary/5 flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="secondary" 
                                    className="h-9 text-xs font-bold border-2 border-primary/20 hover:border-primary transition-all"
                                    onClick={() => handleAiReplace(enhancedContent)}
                                >
                                    <Replace className="h-3 w-3 mr-2" /> Replace Original
                                </Button>
                                <Button 
                                    variant="secondary" 
                                    className="h-9 text-xs font-bold border-2 border-primary/20 hover:border-primary transition-all"
                                    onClick={() => handleAiAppend(enhancedContent)}
                                >
                                    <ArrowLeft className="h-3 w-3 mr-2 rotate-180" /> Append to Note
                                </Button>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full h-9 text-xs font-bold border-2 border-foreground/10 hover:border-primary transition-all"
                                onClick={() => {
                                    navigator.clipboard.writeText(enhancedContent)
                                    toast.success('Copied to clipboard')
                                }}
                            >
                                Copy AI Output
                            </Button>
                        </div>
                    </div>
                )}

                {/* Right Column: AI Sidebar */}
                <div className="flex flex-col border-l-2 border-foreground/10 pl-6 h-full overflow-y-auto custom-scrollbar">
                    <AISidebar 
                        content={content} 
                        onReplace={handleAiReplace} 
                        onAppend={handleAiAppend} 
                    />
                </div>
            </div>
        </div>
    )
}