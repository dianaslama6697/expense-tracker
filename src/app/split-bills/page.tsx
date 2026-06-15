"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Handshake, Loader2, ChevronRight, Users, ShoppingBag, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type SplitBillItem = {
  id: string
  merchant: string
  shareCode: string
  totalAmount: string
  createdAt: string
  _count: { items: number; persons: number }
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function SplitBillsPage() {
  const [list, setList] = useState<SplitBillItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/v1/split-bills")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) setList(data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-zinc-400 dark:text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold dark:text-zinc-100">Split Bill</h1>
        <Link href="/split-bill">
          <Button className="rounded-full">
            <Handshake className="mr-1.5 size-4" />
            Buat Baru
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center dark:bg-zinc-900">
          <Handshake className="mx-auto mb-3 size-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada split bill. Buat yang pertama!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((sb) => (
            <Link
              key={sb.id}
              href={`/split/${sb.shareCode}`}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/70"
            >
              <div className="flex size-10 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/40">
                <Handshake className="size-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium dark:text-zinc-100">{sb.merchant}</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatDate(sb.createdAt)}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="size-3" />
                    {sb._count.items}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {sb._count.persons}
                  </span>
                  <span className="font-medium">{formatCurrency(Number(sb.totalAmount))}</span>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
