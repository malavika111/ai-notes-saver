import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogOut, LayoutDashboard, Settings, PenSquare, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderList } from '@/components/dashboard/FolderList'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar Navigation */}
            <aside className="w-68 border-r-2 border-foreground/5 bg-white flex flex-col pt-10 pb-4 px-6 sticky top-0 h-full">
                <div className="mb-10 flex items-center gap-3">
                    <div className="w-10 h-10 sketch-border flex items-center justify-center bg-foreground text-background">
                        <PenSquare className="h-6 w-6" />
                    </div>
                    <Link href="/" className="block">
                        <h1 className="text-2xl font-black tracking-tight hover:opacity-80 transition">
                            AI Notes
                        </h1>
                    </Link>
                </div>

                <div className="relative mb-8">
                    <Input 
                        placeholder="Search notes..." 
                        className="sketch-border bg-[#f8f6f3]/50 border-foreground/10 h-10 pl-4 font-bold placeholder:text-foreground/30"
                    />
                </div>

                <nav className="flex-1 space-y-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start font-bold text-lg hover:bg-foreground/5 transition-colors group">
                            <LayoutDashboard className="mr-3 h-5 w-5 group-hover:rotate-6 transition-transform" />
                            All Notes
                        </Button>
                    </Link>
                    
                    <div className="pt-4">
                        <p className="text-xs font-black text-foreground/30 uppercase tracking-widest mb-4 px-2">Folders</p>
                        <FolderList />
                    </div>
                </nav>

                <div className="mt-auto pt-4 space-y-3">
                    <Button variant="ghost" className="w-full justify-start font-bold text-foreground/60 hover:bg-foreground/5">
                        <Settings className="mr-3 h-5 w-5" />
                        Notebook Settings
                    </Button>
                    <form action="/api/auth/signout" method="post">
                        <Button variant="ghost" type="submit" className="w-full justify-start font-bold text-red-500 hover:bg-red-50">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto notebook-grid relative bg-background/30">
                <div className="container mx-auto p-12 max-w-6xl">
                    {children}
                </div>
            </main>
        </div>
    )
}
