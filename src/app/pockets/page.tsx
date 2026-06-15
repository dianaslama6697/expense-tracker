"use client"

import { useState, useEffect } from "react"
import { Drawer } from "vaul"
import { Plus, Wallet, Pencil, Trash2, Loader2 } from "lucide-react"

type Category = {
  id: string
  name: string
  color: string | null
}

type PocketCategory = {
  id: string
  name: string
  color: string | null
}

type PocketItem = {
  id: string
  name: string
  emoji: string | null
  color: string | null
  budgetAmount: number
  spent: number
  remaining: number
  percentage: number
  categories: PocketCategory[]
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

const EMOJIS = ["👜", "🍔", "🚗", "🏠", "💡", "🎮", "💊", "📚", "🎵", "✈️", "👕", "🐾", "🏃", "⚽", "🎬", "☕"]

export default function PocketsPage() {
  const [pockets, setPockets] = useState<PocketItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PocketItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formEmoji, setFormEmoji] = useState("👜")
  const [formColor, setFormColor] = useState("#3b82f6")
  const [formAmount, setFormAmount] = useState("")
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([])

  async function fetchData() {
    const [pRes, cRes] = await Promise.all([
      fetch("/api/v1/pockets"),
      fetch("/api/v1/categories"),
    ])
    if (pRes.ok) setPockets(await pRes.json())
    if (cRes.ok) setCategories(await cRes.json())
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  function openCreate() {
    setEditing(null)
    setFormName("")
    setFormEmoji("👜")
    setFormColor("#3b82f6")
    setFormAmount("")
    setFormCategoryIds([])
    setDrawerOpen(true)
  }

  function openEdit(p: PocketItem) {
    setEditing(p)
    setFormName(p.name)
    setFormEmoji(p.emoji || "👜")
    setFormColor(p.color || "#3b82f6")
    setFormAmount(String(p.budgetAmount))
    setFormCategoryIds(p.categories.map((c) => c.id))
    setDrawerOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        name: formName,
        emoji: formEmoji,
        color: formColor,
        amount: Number(formAmount.replace(/[^0-9]/g, "")),
        categoryIds: formCategoryIds,
      }
      const url = editing
        ? `/api/v1/pockets/${editing.id}`
        : "/api/v1/pockets"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setDrawerOpen(false)
        fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pocket ini?")) return
    const res = await fetch(`/api/v1/pockets/${id}`, { method: "DELETE" })
    if (res.ok) fetchData()
  }

  function toggleCategory(catId: string) {
    setFormCategoryIds((prev) =>
      prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId]
    )
  }

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
        <h1 className="text-lg font-semibold dark:text-zinc-100">Kantong</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200"
        >
          <Plus className="size-4" />
          Kantong Baru
        </button>
      </div>

      {pockets.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center dark:bg-zinc-900">
          <Wallet className="mx-auto mb-3 size-8 text-zinc-300 dark:text-zinc-600" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Belum ada kantong. Buat kantong pertama kamu!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pockets.map((p) => {
            const isOver = p.percentage > 100
            const isWarning = p.percentage >= 80 && p.percentage <= 100
            return (
              <div
                key={p.id}
                className="rounded-2xl border bg-white p-4 dark:bg-zinc-900"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-medium dark:text-zinc-100">{p.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-500 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-2 flex items-baseline justify-between">
                  <span className={`text-2xl font-bold ${isOver ? "text-red-600 dark:text-red-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {formatCurrency(p.remaining)}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    dari {formatCurrency(p.budgetAmount)}
                  </span>
                </div>

                <div className="mb-3 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(p.percentage, 100)}%` }}
                  />
                </div>

                {p.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.categories.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500 dark:text-zinc-400"
                        style={{ backgroundColor: c.color ? `${c.color}20` : undefined }}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Drawer.Root open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-8 pt-4 outline-none dark:bg-zinc-900">
            <Drawer.Handle />
            <div className="mx-auto max-w-sm">
              <h3 className="mb-4 text-center text-sm font-medium dark:text-zinc-100">
                {editing ? "Edit Kantong" : "Kantong Baru"}
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Nama</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    placeholder="Nama kantong"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Emoji</label>
                  <div className="flex flex-wrap gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setFormEmoji(e)}
                        className={`size-9 rounded-lg text-lg transition-colors ${
                          formEmoji === e ? "bg-zinc-200 ring-2 ring-zinc-400 dark:bg-zinc-700 dark:ring-zinc-500" : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Budget Bulanan</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    placeholder="Contoh: 1500000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Kategori</label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => {
                      const selected = formCategoryIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategory(c.id)}
                          className={`rounded-full px-3 py-1 text-xs transition-colors ${
                            selected
                              ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {c.name}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving || !formName || !formAmount}
                  onClick={handleSave}
                  className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200"
                >
                  {saving ? "Menyimpan..." : editing ? "Simpan" : "Buat Kantong"}
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
