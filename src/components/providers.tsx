"use client"

import { SessionProvider } from "next-auth/react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

type ThemeContext = {
  theme: "light" | "dark"
  toggleTheme: () => void
}

const ThemeCtx = createContext<ThemeContext>({ theme: "light", toggleTheme: () => {} })

export function useTheme() {
  return useContext(ThemeCtx)
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null
    if (stored) {
      setTheme(stored)
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "light" ? "dark" : "light"))
  }, [])

  return (
    <ThemeCtx.Provider value={{ theme, toggleTheme }}>
      <SessionProvider>{children}</SessionProvider>
    </ThemeCtx.Provider>
  )
}
