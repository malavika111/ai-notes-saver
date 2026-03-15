import { NextResponse } from "next/server"
import pdfParse from "pdf-parse"

export async function POST(req: Request) {
    try {

        const formData = await req.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            )
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        let extractedText = ""

        if (file.name.toLowerCase().endsWith(".pdf")) {
            const data = await pdfParse(buffer)
            extractedText = data.text
        } else if (file.name.toLowerCase().endsWith(".txt")) {
            extractedText = buffer.toString("utf-8")
        } else {
            return NextResponse.json(
                { error: "Only PDF and TXT files supported" },
                { status: 400 }
            )
        }

        return NextResponse.json({
            fileName: file.name,
            text: extractedText
        })

    } catch (error: any) {

        console.error("Extraction error:", error)

        return NextResponse.json(
            { error: "Failed to extract text from file" },
            { status: 500 }
        )
    }
}
