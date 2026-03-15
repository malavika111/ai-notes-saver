'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useRandomRotation } from '@/hooks/useRandomRotation'

interface NoteCardProps {
    id: string;
    title: string;
    preview: string;
    updatedAt: string;
    hasAiEnhanced?: boolean;
    onRefresh?: () => void;
}

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { MoreVertical, Edit2, FolderInput, Trash2, Folder as FolderIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function NoteCard({ id, title, preview, updatedAt, hasAiEnhanced = false, onRefresh }: NoteCardProps) {
    // Use custom hook to prevent hydration mismatch on server render
    const rotation = useRandomRotation()
    const supabase = createClient()
    const router = useRouter()
    
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
    const [newTitle, setNewTitle] = useState(title)
    const [folders, setFolders] = useState<any[]>([])
    const [isFoldersLoading, setIsFoldersLoading] = useState(false)

    const fetchFolders = async () => {
        setIsFoldersLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching folders:', error)
            toast.error('Failed to load folders')
        } else {
            setFolders(data || [])
        }
        setIsFoldersLoading(false)
    }

    const handleMoveToFolder = async (folderId: string | null) => {
        const toastId = toast.loading("Moving note...")
        const { error } = await supabase
            .from("notes")
            .update({ folder_id: folderId })
            .eq("id", id)

        if (error) {
            toast.error("Failed to move note", { id: toastId })
            console.error(error)
        } else {
            toast.success("Note moved", { id: toastId })
            setIsMoveDialogOpen(false)
            onRefresh?.()
        }
    }

    const handleRenameClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setNewTitle(title)
        setIsRenameDialogOpen(true)
    }

    const confirmRename = async () => {
        if (!newTitle || newTitle === title) {
            setIsRenameDialogOpen(false)
            return
        }

        const toastId = toast.loading("Renaming note...")
        const { error } = await supabase
            .from("notes")
            .update({ title: newTitle })
            .eq("id", id)

        if (error) {
            toast.error("Failed to rename note", { id: toastId })
            console.error(error)
        } else {
            toast.success("Note renamed", { id: toastId })
            setIsRenameDialogOpen(false)
            onRefresh?.()
        }
    }

    const confirmDelete = async () => {
        const toastId = toast.loading("Deleting note...")
        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", id)

        if (error) {
            toast.error("Failed to delete note", { id: toastId })
            console.error(error)
        } else {
            toast.success("Note deleted", { id: toastId })
            setIsDeleteDialogOpen(false)
            onRefresh?.()
        }
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDeleteDialogOpen(true)
    }

    const handleCardClick = () => {
        router.push(`/editor/${id}`)
    }

    return (
        <motion.div
            whileHover={{
                scale: 1.02,
                rotate: 0,
                y: -4,
                boxShadow: '8px 12px 0 rgba(0,0,0,0.08)'
            }}
            style={{ rotate: `${rotation}deg` }}
            initial={false}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            layout
        >
            <Card 
                onClick={handleCardClick}
                className="h-72 flex flex-col cursor-pointer sketch-border border-foreground/10 shadow-sm bg-white overflow-hidden hover:border-foreground/30 transition-all hover:shadow-md relative group"
            >
                <div className="p-6 flex-1 flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="w-8 h-8 sketch-border flex items-center justify-center bg-blue-50 text-blue-500">
                            <FileText className="h-4 w-4" />
                        </div>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button 
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-foreground/20 hover:text-foreground outline-none p-1 transition-colors"
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent 
                                    align="end" 
                                    className="w-48 sketch-border bg-white"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <DropdownMenuItem 
                                        onClick={handleRenameClick} 
                                        className="flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                        <Edit2 className="h-4 w-4" /> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            e.stopPropagation();
                                            setIsMoveDialogOpen(true); 
                                            fetchFolders();
                                        }} 
                                        className="flex items-center gap-2 cursor-pointer font-bold"
                                    >
                                        <FolderInput className="h-4 w-4" /> Move to Folder
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-foreground/5" />
                                    <DropdownMenuItem 
                                        onClick={handleDeleteClick} 
                                        className="flex items-center gap-2 cursor-pointer text-red-500 font-bold"
                                    >
                                        <Trash2 className="h-4 w-4" /> Delete Note
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-black text-xl leading-tight line-clamp-2 uppercase">
                            {title}
                        </h3>
                        <p className="text-foreground/40 text-sm font-bold line-clamp-3 leading-snug">
                            {preview || "Empty page..."}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-[#f8f6f3]/30 border-t-2 border-foreground/5 flex items-center justify-between">
                    <div className="sketch-border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-foreground/40 border-foreground/10 bg-white">
                        {updatedAt}
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-xs" className="text-foreground/20 hover:text-foreground">
                            <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" className="text-foreground/20 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
                
                {hasAiEnhanced && (
                    <div className="absolute top-2 right-12">
                        <Sparkles className="h-4 w-4 text-orange-400 rotate-12" />
                    </div>
                )}
            </Card>


            {/* Modals placed outside the card but within the motion.div to ensure visibility */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent 
                    className="sm:max-w-md border-2 border-foreground/15 shadow-[8px_8px_0_rgba(0,0,0,0.1)] rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle className="font-mono flex items-center gap-2">
                            <FolderInput className="h-5 w-5 text-primary" /> Move Note to Folder
                        </DialogTitle>
                        <DialogDescription className="font-medium text-foreground/60">
                            Select a folder to store this note or move it to root.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 my-4 max-h-60 overflow-y-auto pr-2">
                        <Button
                            variant="outline"
                            className="justify-start font-mono border-2 border-foreground/10 h-11"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleMoveToFolder(null)
                            }}
                        >
                            <FolderIcon className="mr-3 h-4 w-4 opacity-50" />
                            <span>/ (Root - No Folder)</span>
                        </Button>
                        
                        {isFoldersLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground font-mono italic">
                                No folders found.
                            </div>
                        ) : (
                            folders.map(folder => (
                                <Button
                                    key={folder.id}
                                    variant="outline"
                                    className="justify-start font-mono border-2 border-foreground/10 h-11"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        handleMoveToFolder(folder.id)
                                    }}
                                >
                                    <FolderIcon className="mr-3 h-4 w-4 text-primary" />
                                    <span className="truncate">{folder.name}</span>
                                </Button>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="ghost" 
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsMoveDialogOpen(false)
                            }} 
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent 
                    className="sm:max-w-md border-2 border-destructive/20 shadow-[8px_8px_0_rgba(220,38,38,0.1)] rounded-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle className="font-mono flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" /> Delete Note
                        </DialogTitle>
                        <DialogDescription className="font-medium text-foreground/70">
                            Are you sure you want to delete this note? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 gap-2">
                        <Button 
                            variant="ghost" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsDeleteDialogOpen(false);
                            }} 
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                confirmDelete();
                            }} 
                            className="font-bold shadow-[4px_4px_0_rgba(153,27,27,0.2)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                            Delete Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent 
                    className="sm:max-w-md border-2 border-foreground/15 shadow-[8px_8px_0_rgba(0,0,0,0.1)] rounded-sm bg-[#f8f6f2]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <DialogHeader>
                        <DialogTitle className="font-mono flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-primary" /> Rename Note
                        </DialogTitle>
                        <DialogDescription className="font-medium text-foreground/60">
                            Enter a new name for your note.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    confirmRename()
                                }
                            }}
                            className="w-full bg-white border-2 border-foreground/10 rounded-sm px-3 py-2 outline-none focus:border-primary transition-colors font-mono"
                            autoFocus
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button 
                            variant="ghost" 
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setIsRenameDialogOpen(false)
                            }} 
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                confirmRename()
                            }}
                            className="font-bold shadow-[4px_4px_0_var(--color-primary)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    )
}

