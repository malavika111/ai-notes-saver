'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { LineDrawingTrail } from './LineDrawingTrail'

export function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <>
            <LineDrawingTrail />
            <AnimatePresence mode="wait">
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, rotateY: 90, x: 200, transformOrigin: 'left center' }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    exit={{ opacity: 0, rotateY: -90, x: -200 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="min-h-screen w-full notebook-grid"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </>
    )
}
