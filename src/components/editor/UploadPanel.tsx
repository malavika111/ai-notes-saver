'use client'

import { useState, useRef } from 'react'
import { FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UploadPanelProps {
    onFileUpload: (data: { fileName: string; text: string }) => void
    noteId: string
}

export function UploadPanel({ onFileUpload, noteId }: UploadPanelProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFiles(Array.from(e.target.files))
        }
    }

    const processFiles = async (files: File[]) => {
        if (files.length === 0) return

        setIsUploading(true)
        let successCount = 0

        for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)

            try {
                const res = await fetch('/api/files/upload', {
                    method: 'POST',
                    body: formData
                })

                const data = await res.json()

                if (!res.ok) {
                    toast.error(data.error || 'Upload failed')
                    continue
                }

                if (data.text) {
                    onFileUpload({
                        fileName: data.fileName,
                        text: data.text
                    })
                    successCount++
                }

            } catch (err: any) {
                console.error(err)
                toast.error(`Error uploading ${file.name}`)
            }
        }

        if (successCount > 0) {
            toast.success(
                successCount === 1
                    ? 'File processed successfully!'
                    : `${successCount} files processed successfully!`
            )
        }

        setIsUploading(false)
    }

    return (
        <div
            className={`border-2 border-dashed rounded-sm p-6 text-center transition-colors ${dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-foreground/20 hover:border-primary/50'
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleChange}
            />

            {isUploading ? (
                <div className="flex flex-col items-center justify-center py-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <p className="text-sm font-medium">Extracting text...</p>
                </div>
            ) : (
                <div
                    className="flex flex-col items-center justify-center py-2 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 hover:bg-primary/20 transition-colors">
                        <FileUp className="h-6 w-6 text-primary" />
                    </div>

                    <p className="text-sm font-medium">
                        Click to upload or drag and drop
                    </p>

                    <p className="text-xs text-muted-foreground mt-1">
                        PDF supported (max 10MB)
                    </p>
                </div>
            )}
        </div>
    )
}