"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, History, Wallet, Handshake } from "lucide-react"

const tabs = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Riwayat", icon: History },
  { href: "/split-bills", label: "Split", icon: Handshake },
  { href: "/pockets", label: "Kantong", icon: Wallet },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === "/login") return null

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/90 backdrop-blur-lg pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
