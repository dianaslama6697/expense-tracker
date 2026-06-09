"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

export default function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-10 border-b bg-white">
      <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-3 sm:h-14 sm:px-4">
        <Link href="/" className="text-sm font-semibold sm:text-lg">
          Expense Tracker
        </Link>
        <nav className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          <Link
            href="/"
            className="text-sky-600 transition-colors hover:text-blue-700"
          >
            Dashboard
          </Link>
          <Link
            href="/expenses"
            className="text-sky-600 transition-colors hover:text-blue-700"
          >
            Pengeluaran
          </Link>
          {session?.user && (
            <div className="flex items-center gap-2 border-l pl-3 sm:pl-4">
              <span className="hidden max-w-[120px] truncate text-gray-600 sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-full bg-gray-900 px-3 py-1 text-white transition-colors hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
