'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Wand2, Lightbulb, List, FileQuestion, GraduationCap, Type, Replace, SplitSquareHorizontal, Languages, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { cleanAIText } from '@/lib/utils'

interface AISidebarProps {
    content: string;
    onReplace: (newContent: string) => void;
    onAppend: (addedContent: string) => void;
}

const TOOLS = [
    { id: 'summarize', label: 'Summarize', icon: List },
    { id: 'enhance', label: 'Improve Writing', icon: Sparkles },
    { id: 'flashcards', label: 'Make Flashcards', icon: GraduationCap },
    { id: 'questions', label: 'Generate QA', icon: FileQuestion },
    { id: 'keypoints', label: 'Extract Key Points', icon: Lightbulb },
    { id: 'mindmap', label: 'Mind Map', icon: SplitSquareHorizontal },
    { id: 'rewrite', label: 'Expand/Rewrite', icon: Replace },
    { id: 'eli5', label: 'Explain like I\'m 5', icon: Wand2 },
    { id: 'title', label: 'Suggest Titles', icon: Type },
    { id: 'translate', label: 'Translate', icon: Languages },
]

export function AISidebar({ content, onReplace, onAppend }: AISidebarProps) {
    const [isProcessing, setIsProcessing] = useState<string | null>(null)
    const [targetLanguage, setTargetLanguage] = useState('English')
    const [previewText, setPreviewText] = useState('')

    const handleAiAction = async (action: string) => {
        if (!content.trim()) {
            toast.error('Note is empty. Please write something first.')
            return
        }

        setIsProcessing(action)
        try {
            const res = await fetch('/api/ai/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action, 
                    text: content,
                    targetLanguage: action === 'translate' ? targetLanguage : undefined
                })
            })

            const data = await res.json()

            if (!data.success) throw new Error(data.error || 'Failed to process AI request')

            toast.success('AI generation complete!')
            const cleaned = cleanAIText(data.result)
            setPreviewText(cleaned)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsProcessing(null)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(previewText)
        toast.success('Copied to clipboard')
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--font-mono)' }}>AI Tools</h3>
            </div>
            
            <div className="space-y-2 flex-grow overflow-y-auto pr-2 pb-4">
                {TOOLS.map((tool) => (
                    <div key={tool.id} className="space-y-2">
                        <Button
                            variant="outline"
                            disabled={isProcessing !== null}
                            onClick={() => handleAiAction(tool.id)}
                            className="w-full justify-start h-10 border-2 border-foreground/15 hover:border-primary text-foreground/80 hover:text-primary transition-all font-medium rounded-sm group relative overflow-hidden"
                        >
                            {isProcessing === tool.id ? (
                                <Loader2 className="mr-3 h-4 w-4 animate-spin text-primary" />
                            ) : (
                                <tool.icon className="mr-3 h-4 w-4 text-foreground/60 group-hover:text-primary transition-colors" />
                            )}
                            {tool.label}
                            <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                        </Button>
                        
                        {tool.id === 'translate' && (
                            <div className="flex gap-2 px-1">
                                <button 
                                    onClick={() => setTargetLanguage('Malayalam')}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${targetLanguage === 'Malayalam' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-foreground/20'}`}
                                >
                                    Malayalam
                                </button>
                                <button 
                                    onClick={() => setTargetLanguage('English')}
                                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${targetLanguage === 'English' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-foreground/20'}`}
                                >
                                    English
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* AI Preview Section */}
            {previewText && (
                <div className="mt-4 border-t-2 border-foreground/10 pt-4 flex flex-col gap-3 min-h-[400px] animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">AI Output Preview</h4>
                        <Button variant="ghost" size="sm" onClick={() => setPreviewText('')} className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600">
                             <span className="sr-only">Clear</span>
                             ×
                        </Button>
                    </div>
                    
                    <div className="bg-muted/30 p-3 rounded-sm border border-foreground/5 text-sm font-medium leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
                        {previewText}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs h-8 border border-foreground/10"
                            onClick={() => onReplace(previewText)}
                        >
                            <Replace className="h-3 w-3 mr-1.5" /> Replace Note
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs h-8 border border-foreground/10"
                            onClick={() => onAppend(previewText)}
                        >
                            <ArrowLeft className="h-3 w-3 mr-1.5 rotate-180" /> Append
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="col-span-2 text-xs h-8 border-foreground/10"
                            onClick={handleCopy}
                        >
                            Copy to Clipboard
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
