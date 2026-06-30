"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers"

export default function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b border-border/40 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-3 sm:h-14 sm:px-4">
        <Link href="/">
          <img src="/acis-logo.png" alt="ACIS" className="h-6 sm:h-7" />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {session?.user && (
            <>
              <span className="max-w-[100px] truncate text-xs text-muted-foreground sm:max-w-[140px] sm:text-sm">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-3xl border border-foreground/20 bg-transparent px-2.5 py-0.5 text-xs text-foreground transition-colors hover:bg-secondary sm:px-3 sm:py-1 sm:text-sm"
              >
                Keluar
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
