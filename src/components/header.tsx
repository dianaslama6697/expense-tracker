"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers"

export default function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-11 max-w-4xl items-center justify-between px-3 sm:h-12 sm:px-4">
        <Link href="/" className="text-sm font-semibold sm:text-base">
          Expense Tracker
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {session?.user && (
            <>
              <span className="max-w-[100px] truncate text-xs text-zinc-500 dark:text-zinc-400 sm:max-w-[140px] sm:text-sm">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 sm:px-3 sm:py-1 sm:text-sm"
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
