import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import RegisterSW from "@/components/register_sw"
import Header from "@/components/header"
import Providers from "@/components/providers"
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
        <Providers>
          <RegisterSW />
          <Header />
          <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
          <ScanReceipt />
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
