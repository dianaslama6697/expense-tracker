import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import RegisterSW from "@/components/register_sw"
import Header from "@/components/header"
import BottomNav from "@/components/bottom_nav"
import Providers from "@/components/providers"
import ScanReceipt from "@/components/scan_receipt"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

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
    { rel: "icon", url: "/icons/icon.svg", type: "image/svg+xml" },
    { rel: "apple-touch-icon", url: "/icons/icon-180.png" },
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
    <html lang="id" className={`${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <RegisterSW />
          <Header />
          <main className="mx-auto max-w-4xl px-3 py-4 pb-20 sm:px-4 sm:py-6 sm:pb-24">{children}</main>
          <ScanReceipt />
          <BottomNav />
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontSize: "0.875rem" },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
