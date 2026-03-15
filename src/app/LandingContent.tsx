'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, PenLine, Sparkles, FolderOpen, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function LandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      const errorCode = searchParams.get('error_code')
      const errorDescription = searchParams.get('error_description')

      const params = new URLSearchParams()
      params.set('error', error)
      if (errorCode) params.set('error_code', errorCode)
      if (errorDescription) params.set('error_description', errorDescription)

      router.replace(`/login?${params.toString()}`)
    }

    // Initial user fetch
    supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [searchParams, router, supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3] text-foreground flex flex-col relative overflow-hidden font-sans">
      {/* Background Scribbles */}
      <div className="absolute top-10 left-10 opacity-20 pointer-events-none">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10,20 Q30,10 50,20 T90,20 M15,40 Q40,30 70,45 T85,35" strokeDasharray="2 2" />
          <rect x="20" y="50" width="40" height="30" rx="2" className="sketch-border" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-10 opacity-20 pointer-events-none">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20,100 L100,20 M30,110 L110,30" strokeDasharray="4 4" />
          <path d="M10,10 C40,0 20,50 60,40 S80,90 110,80" />
        </svg>
      </div>

      <header className="px-6 lg:px-14 h-20 flex items-center justify-between mx-auto w-full max-w-7xl">
        <Link className="flex items-center justify-center" href="/">
          <div className="w-10 h-10 sketch-border flex items-center justify-center mr-2 bg-foreground text-background">
            <PenLine className="h-6 w-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight">AI Notes Saver</span>
        </Link>
        <nav className="ml-auto flex gap-6 sm:gap-10 items-center">
          <Link className="text-sm font-bold hover:opacity-70 transition-opacity" href="#features">
            Features
          </Link>
          {user ? (
            <>
              <Link className="text-sm font-bold hover:opacity-70 transition-opacity" href="/dashboard">
                Dashboard
              </Link>
              <button 
                onClick={handleSignOut}
                className="text-sm font-bold hover:opacity-70 transition-opacity text-red-500"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link className="text-sm font-bold hover:opacity-70 transition-opacity" href="/login">
              Sign In
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-20 md:py-32 flex items-center justify-center">
          <div className="px-4 md:px-6 text-center space-y-10 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none">
                AI Notes <span className="sketch-underline">Saver</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-foreground/70 text-xl md:text-2xl font-medium leading-relaxed">
                The imperfect notebook for your perfect ideas. Powered by AI to summarize, enhance, and organize your thoughts beautifully.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
              <Link href={user ? "/dashboard" : "/login"}>
                <Button variant="sketch" className="h-14 px-10 text-xl group">
                  Take Notes <PenLine className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform" />
                </Button>
              </Link>
              {!user && (
                <Link href="/login">
                  <Button variant="sketch-outline" className="h-14 px-10 text-xl group">
                    Get Started <Sparkles className="ml-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-24 mb-20">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { 
                  icon: Sparkles, 
                  title: "AI Enhancement", 
                  desc: "Summarize, expand, and structure your notes instantly using Groq API.",
                  accent: "text-orange-500" 
                },
                { 
                  icon: FolderOpen, 
                  title: "Smart Folders", 
                  desc: "Organize your files (PDF, PPTX, TXT) and notes with ease.",
                  accent: "text-blue-500" 
                },
                { 
                  icon: PenLine, 
                  title: "Notebook Experience", 
                  desc: "A tactile digital workspace that feels like your favorite journal.",
                  accent: "text-green-500" 
                },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col p-8 sketch-border bg-white shadow-sm hover:shadow-md transition-shadow group">
                  <div className={`p-4 w-fit sketch-border mb-6 group-hover:rotate-6 transition-transform ${feature.accent}`}>
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-foreground/60 text-lg leading-snug">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t-2 border-foreground/5 mx-auto w-full max-w-7xl">
        <div className="container flex flex-col md:flex-row items-center justify-between px-4 md:px-6 gap-4">
          <p className="text-sm text-foreground/40 font-bold">
            © {new Date().getFullYear()} AI Notes Saver. Built with imperfect love.
          </p>
          <div className="flex gap-8">
            <Link href="#" className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity whitespace-nowrap">Privacy Policy</Link>
            <Link href="#" className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity whitespace-nowrap">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
