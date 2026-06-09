import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import { Toaster } from "sonner"
import RegisterSW from "@/components/register_sw"
import ScanReceipt from "@/components/scan_receipt"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track your expenses with ease",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
  icons: [
    { rel: "icon", url: "/icons/icon.svg" },
    { rel: "apple-touch-icon", url: "/icons/icon-192.svg" },
  ],
  other: {
    "theme-color": "#ffffff",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body className="min-h-screen bg-[#f1f4f7] font-sans antialiased">
        <RegisterSW />
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
        <ScanReceipt />
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
