'use client'

import { useState, useEffect } from 'react'
import { Folder, FolderOpen, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

interface FolderItem {
    id: string;
    name: string;
}

export function FolderList() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()

    const activeFolder = searchParams.get('folder')

    const [folders, setFolders] = useState<FolderItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')

    // For rename functionality
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
    const [editFolderName, setEditFolderName] = useState('')

    // Dropdown state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)

    useEffect(() => {
        fetchFolders()
    }, [])

    const fetchFolders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching folders:', error)
            toast.error('Failed to load folders')
        } else if (data) {
            setFolders(data)
        }
        setIsLoading(false)
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            setIsAdding(false)
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const toastId = toast.loading('Creating folder...')

        const { data, error } = await supabase
            .from('folders')
            .insert([{ name: newFolderName.trim(), user_id: user.id }])
            .select()
            .single()

        if (error) {
            toast.error('Failed to create folder', { id: toastId })
            console.error(error)
        } else if (data) {
            toast.success('Folder created', { id: toastId })
            setFolders((prev) => [...prev, data])
            setIsAdding(false)
            setNewFolderName('')
        }
    }

    const handleDeleteFolder = async (folderId: string) => {
        const toastId = toast.loading('Deleting folder...')

        // Optimistic update
        const previousFolders = [...folders]
        setFolders(folders.filter(f => f.id !== folderId))

        const { error } = await supabase
            .from('folders')
            .delete()
            .eq('id', folderId)

        if (error) {
            setFolders(previousFolders) // Revert on error
            toast.error('Failed to delete folder', { id: toastId })
            console.error(error)
        } else {
            toast.success('Folder deleted', { id: toastId })
            setOpenMenuId(null)
            if (activeFolder === folderId) {
                router.push('/dashboard')
            }
        }
    }

    const handleRenameFolder = async (folderId: string) => {
        if (!editFolderName.trim()) {
            setEditingFolderId(null)
            return
        }

        const toastId = toast.loading('Renaming folder...')

        // Optimistic update
        setFolders(folders.map(f => f.id === folderId ? { ...f, name: editFolderName } : f))

        const { error } = await supabase
            .from('folders')
            .update({ name: editFolderName.trim() })
            .eq('id', folderId)

        if (error) {
            // Refetch to ensure accuracy on failure
            fetchFolders()
            toast.error('Failed to rename folder', { id: toastId })
            console.error(error)
        } else {
            toast.success('Folder renamed', { id: toastId })
        }
        setEditingFolderId(null)
    }

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between text-foreground/30 px-2 text-[10px] font-black tracking-widest uppercase mb-2">
                <span>FOLDERS</span>
                <button onClick={() => setIsAdding(true)} className="hover:text-foreground transition-colors outline-none cursor-pointer p-1 sketch-border border-foreground/5 bg-white shadow-sm">
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {isAdding && (
                <div className="px-2 mb-2">
                    <input
                        autoFocus
                        type="text"
                        className="w-full bg-background border border-primary/30 rounded-sm px-3 py-1 text-sm focus:outline-none focus:border-primary font-mono placeholder-muted-foreground/50"
                        placeholder="New folder name..."
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateFolder()
                            } else if (e.key === 'Escape') {
                                setIsAdding(false)
                                setNewFolderName('')
                            }
                        }}
                        onBlur={() => {
                            // Only blur-cancel if empty
                            if (!newFolderName.trim()) setIsAdding(false)
                        }}
                    />
                </div>
            )}

            <div className="space-y-1 relative">
                {/* Fallback loading state for folders to prevent sudden layout shifts */}
                {isLoading && folders.length === 0 && (
                    <div className="px-4 py-2 text-sm text-foreground/50 animate-pulse">Loading folders...</div>
                )}

                <Button
                    variant="ghost"
                    className={`w-full justify-start font-bold text-sm h-11 px-3 transition-all ${activeFolder === null ? "bg-foreground/5 text-foreground" : "text-foreground/60"}`}
                    onClick={() => router.push('/dashboard')}
                >
                    <Folder className={`mr-3 h-5 w-5 ${activeFolder === null ? "text-foreground" : "text-foreground/20"}`} />
                    All Notes
                </Button>

                {folders.map((folder) => (
                    <div key={folder.id} className="relative group">
                        {editingFolderId === folder.id ? (
                            <div className="px-2 py-1">
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-background border border-primary/30 rounded-sm px-2 py-1 text-sm focus:outline-none focus:border-primary font-mono"
                                    value={editFolderName}
                                    onChange={(e) => setEditFolderName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameFolder(folder.id)
                                        else if (e.key === 'Escape') setEditingFolderId(null)
                                    }}
                                    onBlur={() => handleRenameFolder(folder.id)}
                                />
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                className={`w-full justify-start font-bold text-sm h-11 px-3 transition-all ${activeFolder === folder.id ? "bg-foreground/5 text-foreground" : "text-foreground/60"}`}
                                onClick={() => router.push(`/dashboard?folder=${folder.id}`)}
                            >
                                <span className="flex-1 text-left flex items-center overflow-hidden whitespace-nowrap text-ellipsis mr-2">
                                    <Folder className={`mr-3 h-5 w-5 shrink-0 ${activeFolder === folder.id ? "text-foreground" : "text-foreground/20"}`} />
                                    <span className="truncate">{folder.name}</span>
                                </span>
                            </Button>
                        )}

                        {/* More Menu Toggle */}
                        {editingFolderId !== folder.id && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === folder.id ? null : folder.id);
                                }}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all ${openMenuId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </button>
                        )}

                        {/* Dropdown Menu (Absolute) */}
                        {openMenuId === folder.id && (
                            <div
                                className="absolute right-0 top-10 mt-1 w-36 bg-popover text-popover-foreground border-2 border-foreground/15 rounded-sm shadow-md z-50 overflow-hidden"
                                onMouseLeave={() => setOpenMenuId(null)}
                            >
                                <div className="flex flex-col text-sm font-medium">
                                    <button
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-primary/10 transition-colors text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditFolderName(folder.name);
                                            setEditingFolderId(folder.id);
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4" /> Rename
                                    </button>
                                    <button
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-destructive/10 text-destructive transition-colors text-left"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteFolder(folder.id)
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Global click handler to close dropdown if clicking outside. Hack for demo context. */}
            {openMenuId && (
                <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
            )}
        </div>
    )
}
