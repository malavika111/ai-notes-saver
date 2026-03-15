import Groq from 'groq-sdk'

// Initialize Groq optionally so it won't crash if the key is missing at build time
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_build' })

// Default model for reasoning / text generation
const MODEL = 'llama-3.1-8b-instant'

async function generateCompletion(systemPrompt: string, userText: string) {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'placeholder_groq') {
        return `[MOCK GROQ API] Please add a real GROQ_API_KEY to your .env.local file to use this feature.\n\nSimulated result for prompt:\n${systemPrompt.slice(0, 50)}...`
    }

    let retries = 0;
    const maxRetries = 2; // Retry twice

    while (retries <= maxRetries) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userText }
                ],
                model: MODEL,
                temperature: 0.5,
                max_tokens: 800,
            })

            return completion.choices[0]?.message?.content || ''
        } catch (error: any) {
            if (error?.status === 429 && retries < maxRetries) {
                console.warn(`Groq Rate limit hit. Retrying in 15s... (Attempt ${retries + 1})`);
                await new Promise(resolve => setTimeout(resolve, 15000));
                retries++;
                continue;
            }
            throw error;
        }
    }
    return '';
}

export async function generateSummary(text: string) {
    return generateCompletion(
        "You are a helpful study assistant. Provide a concise, highly structured summary of the following notes. Use bullet points.",
        text
    )
}

export async function enhanceNotes(text: string) {
    return generateCompletion(
        "You are an expert editor. Improve the structure, clarity, and grammatical correctness of the following notes while retaining all original meaning.",
        text
    )
}

export async function generateFlashcards(text: string) {
    return generateCompletion(
        "Create 5-10 study flashcards based on the provided text. Format them clearly with 'Q:' for the question and 'A:' for the answer.",
        text
    )
}

export async function generateQuestions(text: string) {
    return generateCompletion(
        "Generate 5 challenging exam-style questions based on the provided notes. Provide the answers at the very bottom.",
        text
    )
}

export async function extractKeyPoints(text: string) {
    return generateCompletion(
        "Extract the most essential key points from the provided text. Format as a clean, easy-to-read list.",
        text
    )
}

export async function generateMindMap(text: string) {
    return generateCompletion(
        "Create a text-based mind map outline of the provided notes using hierarchical bullet points (e.g., - Main Topic \n  - Subtopic 1 \n    - Detail).",
        text
    )
}

export async function rewriteNotes(text: string) {
    return generateCompletion(
        "Rewrite these notes to be flow better and be more comprehensive, expanding on concepts slightly where helpful.",
        text
    )
}

export async function explainLikeIm5(text: string) {
    return generateCompletion(
        "Explain the following concepts as concisely and simply as possible, as if explaining to a 5-year-old.",
        text
    )
}

export async function generateTitle(text: string) {
    return generateCompletion(
        "Suggest 3 catchy and accurate titles for the following notes. Only return the titles.",
        text
    )
}

export async function translateNotes(text: string, targetLanguage: string = 'English') {
    let prompt = `Translate the following text to ${targetLanguage}. Preserve the original structure and formatting.`
    
    if (targetLanguage.toLowerCase() === 'malayalam') {
        prompt = "Translate the following text into Malayalam while preserving meaning, tone, and formatting."
    }

    return generateCompletion(prompt, text)
}
