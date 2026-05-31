import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses with ease",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body className="min-h-screen bg-[#f1f4f7] font-sans antialiased">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-3 sm:h-14 sm:px-4">
            <Link href="/" className="text-sm font-semibold sm:text-lg">
              Expense Tracker
            </Link>
            <nav className="flex gap-3 text-xs sm:gap-4 sm:text-sm">
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
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontSize: "0.875rem" },
          }}
        />
      </body>
    </html>
  )
}
