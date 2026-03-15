'use client'

import { useState, useEffect } from 'react'

export function useRandomRotation() {
    const [rotation, setRotation] = useState(0)

    useEffect(() => {
        // Generate a random rotation between -2 and 2 degrees
        setRotation(Math.random() * 4 - 2)
    }, [])

    return rotation
}
