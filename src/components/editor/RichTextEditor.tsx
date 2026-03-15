'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'
import { Save, Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
    initialContent?: string;
    onSave: (content: string) => void;
    onEditorReady?: (editor: any) => void;
}

export function RichTextEditor({ initialContent = '', onSave, onEditorReady }: RichTextEditorProps) {
    const [mounted, setMounted] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit,
        ],
        content: initialContent,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] p-6 leading-relaxed notebook-grid cursor-text w-full max-w-none',
            },
        },
        onUpdate: ({ editor }) => {
            onSave(editor.getHTML())
        },
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (mounted && editor && onEditorReady) {
            onEditorReady(editor)
        }
    }, [mounted, editor, onEditorReady])

    // Update editor content if initialContent changes externally (e.g., initial load)
    useEffect(() => {
        if (mounted && editor && initialContent && initialContent !== editor.getHTML()) {
            if (editor.isEmpty) {
                editor.commands.setContent(initialContent)
            }
        }
    }, [mounted, editor, initialContent])

    if (!mounted) return null

    if (!editor) {
        return (
            <div className="flex flex-col h-full bg-card border-2 border-foreground/15 shadow-[4px_4px_0_rgba(0,0,0,0.05)] rounded-sm overflow-hidden min-h-[450px]">
                <div className="flex items-center justify-between p-2 border-b-2 border-foreground/10 bg-muted/30 h-12" />
                <div className="flex-1 p-6 notebook-grid animate-pulse bg-muted/5" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-card border-2 border-foreground/15 shadow-[4px_4px_0_rgba(0,0,0,0.05)] rounded-sm overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b-2 border-foreground/10 bg-muted/30">
                <div className="flex gap-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-foreground/70"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-foreground/70"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 my-1" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-primary/20 text-primary' : 'text-foreground/70'}`}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-primary/20 text-primary' : 'text-foreground/70'}`}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 my-1" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : 'text-foreground/70'}`}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : 'text-foreground/70'}`}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center text-xs text-muted-foreground font-medium font-mono">
                    <span className="flex items-center gap-1 opacity-70"><Save className="h-3 w-3" /> Auto-saving</span>
                </div>
            </div>

            <div className="flex-1 p-0 relative overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
