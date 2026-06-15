"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2, Share2, Check } from "lucide-react"
import { toast } from "sonner"

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

type Person = {
  id: string
  name: string
  assignments: { quantity: number; item: { id: string; name: string; price: number; quantity: number } }[]
}

type Item = {
  id: string
  name: string
  price: number
  quantity: number
}

type SplitBillData = {
  id: string
  merchant: string
  totalAmount: number
  tax: number
  serviceCharge: number
  shareCode: string
  user: { name: string | null }
  persons: Person[]
  items: Item[]
}

export default function SplitBillView() {
  const params = useParams()
  const code = params.code as string
  const [data, setData] = useState<SplitBillData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/v1/split-bills/${code}`)
        if (res.ok) setData(await res.json())
      } catch {
        console.error("Failed to fetch split bill")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [code])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-400 dark:text-zinc-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-500">Split bill tidak ditemukan</p>
      </div>
    )
  }

  const totalTax = Number(data.tax) + Number(data.serviceCharge)
  const totalItems = data.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0)
  const assignedTotals: Record<string, number> = {}
  const assignedItemIds = new Set<string>()

  for (const p of data.persons) {
    let t = 0
    for (const a of p.assignments) {
      const qty = a.quantity > 0 ? a.quantity : a.item.quantity
      t += Number(a.item.price) * qty
      assignedItemIds.add(a.item.id)
    }
    assignedTotals[p.id] = t
  }

  const unassignedTotal = data.items
    .filter((i) => !assignedItemIds.has(i.id))
    .reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  const personCount = data.persons.length || 1
  const unassignedShare = unassignedTotal / personCount
  const taxableTotal = totalItems || 1

  function shareWhatsApp() {
    if (!data) return
    const url = window.location.href
    const lines = [`Split Bill - ${data.merchant}\n`]
    for (const p of data.persons) {
      const it = assignedTotals[p.id] || 0
      const subtotal = it + unassignedShare
      const personTax = (subtotal / taxableTotal) * totalTax
      lines.push(
        `${p.name}: ${formatCurrency(Math.round(subtotal + personTax))}`
      )
    }
    lines.push(`\nLihat detail: ${url}`)
    const msg = encodeURIComponent(lines.join("\n"))
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Split Bill</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">{data.merchant}</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Dibuat oleh {data.user.name || "Unknown"}
            </p>
          </div>
          <button
            onClick={shareWhatsApp}
            className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
          >
            <Share2 className="size-5" />
          </button>
        </div>

        <div className="mb-4 space-y-1 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-500">Total Item</span>
            <span className="font-medium">{formatCurrency(totalItems)}</span>
          </div>
          {Number(data.tax) > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-500">Pajak</span>
              <span className="font-medium">
                {formatCurrency(Number(data.tax))}
              </span>
            </div>
          )}
          {Number(data.serviceCharge) > 0 && (
            <div className="flex justify-between">
              <span className="text-zinc-500 dark:text-zinc-500">Service Charge</span>
              <span className="font-medium">
                {formatCurrency(Number(data.serviceCharge))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-bold">
            <span>Total</span>
            <span>{formatCurrency(totalItems + totalTax)}</span>
          </div>
        </div>

        <div className="space-y-2">
          {data.persons.map((p) => {
            const it = assignedTotals[p.id] || 0
            const subtotal = it + unassignedShare
            const personTax = (subtotal / taxableTotal) * totalTax
            return (
              <div
                key={p.id}
                className="rounded-xl border p-3 dark:bg-zinc-900"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white dark:bg-white dark:text-gray-900">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(Math.round(subtotal + personTax))}
                  </span>
                </div>
                {p.assignments.length > 0 && (
                  <div className="space-y-0.5 pl-9 text-xs text-zinc-500 dark:text-zinc-500">
                    {p.assignments.map((a, i) => {
                      const qty = a.quantity > 0 ? a.quantity : a.item.quantity
                      return (
                      <p key={i}>
                        {a.item.name}{qty > 1 && ` ×${qty}`} —{" "}
                        {formatCurrency(Number(a.item.price) * qty)}
                      </p>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {unassignedTotal > 0 && (
          <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
            *{formatCurrency(unassignedTotal)} item yang tidak di-assign dibagi
            rata ({formatCurrency(Math.round(unassignedShare))}/orang)
          </p>
        )}
      </div>
    </div>
  )
}
