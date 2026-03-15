import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, original_content, folder_id, ai_enhanced_content } = await req.json()

        // Assuming saving note to db
        const { data, error } = await supabase.from('notes').insert([
            {
                user_id: user.id,
                title,
                original_content,
                folder_id: folder_id || null,
                ai_enhanced_content
            }
        ]).select().single()

        if (error) {
            console.error("Insert failed", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ note: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id, title, original_content, folder_id, ai_enhanced_content } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'No ID provided' }, { status: 400 })
        }

        const { data, error } = await supabase.from('notes')
            .update({ title, original_content, folder_id, ai_enhanced_content })
            .eq('id', id)
            .eq('user_id', user.id)
            .select().single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ note: data })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
