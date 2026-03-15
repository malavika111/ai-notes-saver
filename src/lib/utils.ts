import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function cleanAIText(text: string) {
  if (!text) return ""
  return text
    .replace(/#+\s/g, '')        // remove headings
    .replace(/\*\*/g, '')        // remove bold markers
    .replace(/\*/g, '')          // remove single asterisks
    .replace(/\+\s/g, '')        // remove plus bullets
    .replace(/-\s/g, '')         // remove dash bullets
    .replace(/\n{2,}/g, '\n\n')  // normalize spacing
    .trim()
}
