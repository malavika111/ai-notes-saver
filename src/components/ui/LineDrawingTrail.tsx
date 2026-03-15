'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimation } from 'framer-motion'

export function LineDrawingTrail() {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        let lastX = 0
        let lastY = 0
        let isDrawing = false

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing) {
                lastX = e.clientX
                lastY = e.clientY
                isDrawing = true
                return
            }

            const dx = e.clientX - lastX
            const dy = e.clientY - lastY
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance > 10) { // Only draw if moved enough
                const line = document.createElement('div')
                line.className = 'absolute bg-primary/20 pointer-events-none rounded-full'
                line.style.left = `${lastX}px`
                line.style.top = `${lastY}px`
                line.style.width = `${distance}px`
                line.style.height = '2px'

                const angle = Math.atan2(dy, dx) * 180 / Math.PI
                line.style.transformOrigin = '0 50%'
                line.style.transform = `rotate(${angle}deg)`

                container.appendChild(line)

                // Custom pencil stroke imperfection
                line.style.boxShadow = '0 0 1px rgba(0,0,0,0.1)'

                // Fade out and remove
                setTimeout(() => {
                    line.style.transition = 'opacity 0.6s ease-out'
                    line.style.opacity = '0'
                    setTimeout(() => {
                        if (container.contains(line)) container.removeChild(line)
                    }, 600)
                }, 300)

                lastX = e.clientX
                lastY = e.clientY
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        />
    )
}
