import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as aiTools from '@/lib/groq'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { action, text, noteId, targetLanguage } = await req.json()

        if (!text) {
            return NextResponse.json({ error: 'No text provided' }, { status: 400 })
        }

        // Helper to chunk text if it's too long
        const chunkText = (str: string, size: number) => {
            const chunks = []
            for (let i = 0; i < str.length; i += size) {
                chunks.push(str.slice(i, i + size))
            }
            return chunks
        }

        let result = ''
        const MAX_CHARS = 6000
        const CHUNK_SIZE = 4000

        const processAction = async (inputText: string) => {
            switch (action) {
                case 'summarize': return await aiTools.generateSummary(inputText);
                case 'enhance': return await aiTools.enhanceNotes(inputText);
                case 'flashcards': return await aiTools.generateFlashcards(inputText);
                case 'questions': return await aiTools.generateQuestions(inputText);
                case 'keypoints': return await aiTools.extractKeyPoints(inputText);
                case 'mindmap': return await aiTools.generateMindMap(inputText);
                case 'rewrite': return await aiTools.rewriteNotes(inputText);
                case 'eli5': return await aiTools.explainLikeIm5(inputText);
                case 'title': return await aiTools.generateTitle(inputText);
                case 'translate': return await aiTools.translateNotes(inputText, targetLanguage);
                default: throw new Error('Invalid AI action');
            }
        }

        if (text.length > MAX_CHARS) {
            const chunks = chunkText(text, CHUNK_SIZE)
            const results = []
            for (const chunk of chunks) {
                const chunkResult = await processAction(chunk)
                results.push(chunkResult)
            }
            result = results.join('\n\n---\n\n')
        } else {
            result = await processAction(text)
        }

        // Attempt to save to note directly if an ID was passed
        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('AI Processing Error:', error)
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Something went wrong processing AI' 
        }, { status: 500 })
    }
}
