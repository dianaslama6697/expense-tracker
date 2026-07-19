"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Copy, Check, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion_wrappers"
import MerchantInput from "@/components/merchant_input"

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
}

type Expense = {
  id: string
  amount: number
  currency: string
  merchant: string | null
  description: string | null
  expenseDate: string
  source: string
  createdAt: string
  category: Category
}

type FormData = {
  amount: string
  categoryId: string
  merchant: string
  description: string
  expenseDate: string
}

const emptyForm: FormData = {
  amount: "",
  categoryId: "",
  merchant: "",
  description: "",
  expenseDate: new Date().toISOString().split("T")[0],
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

export default function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState("")
  const [periodLabel, setPeriodLabel] = useState("")
  const amountRef = useRef<HTMLInputElement>(null)

  const fetchExpenses = useCallback(async () => {
    try {
      const now = new Date()
      const d = now.getDate()
      const base = new Date(now.getFullYear(), now.getMonth(), 25)
      if (d < 25) base.setMonth(base.getMonth() - 1)
      const s = new Date(base.getFullYear(), base.getMonth(), 25)
      const e = new Date(base.getFullYear(), base.getMonth() + 1, 24)
      const start = s.toISOString().split("T")[0]
      const end = e.toISOString().split("T")[0]
      setPeriodLabel(`${format(s, "d MMM", { locale: id })} - ${format(e, "d MMM yyyy", { locale: id })}`)
      const res = await fetch(`/api/v1/expenses?start=${start}&end=${end}`)
      if (res.ok) setExpenses(await res.json())
    } catch {
      console.error("Failed to fetch expenses")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/categories")
      if (res.ok) setCategories(await res.json())
    } catch {
      console.error("Failed to fetch categories")
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
    fetchCategories()
  }, [fetchExpenses, fetchCategories])

  useEffect(() => {
    const handler = () => fetchExpenses()
    window.addEventListener("refresh-data", handler)
    return () => window.removeEventListener("refresh-data", handler)
  }, [fetchExpenses])

  useEffect(() => {
    if (showForm && amountRef.current) {
      setTimeout(() => amountRef.current?.focus(), 150)
    }
  }, [showForm])

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
    setError("")
  }

  function openEdit(expense: Expense) {
    setForm({
      amount: expense.amount.toString(),
      categoryId: expense.category.id,
      merchant: expense.merchant || "",
      description: expense.description || "",
      expenseDate: expense.expenseDate.split("T")[0],
    })
    setEditingId(expense.id)
    setShowForm(true)
  }

  async function fetchSuggestion(merchant: string) {
    if (!merchant) return
    try {
      const res = await fetch(`/api/v1/merchants/suggest?merchant=${encodeURIComponent(merchant)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.id && !editingId) {
          setForm((prev) => ({ ...prev, categoryId: data.id }))
        }
      }
    } catch {
      // silent
    }
  }

  function handleMerchantSelect(merchant: string) {
    setForm((prev) => ({ ...prev, merchant }))
    fetchSuggestion(merchant)
  }

  function handleAmountChange(value: string) {
    setForm((prev) => ({ ...prev, amount: value.replace(/[^0-9]/g, "") }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!form.amount || !form.categoryId) {
      setError("Jumlah dan kategori wajib diisi")
      return
    }
    if (Number(form.amount) <= 0) {
      setError("Jumlah harus lebih dari 0")
      return
    }

    setSaving(true)
    try {
      const url = editingId
        ? `/api/v1/expenses/${editingId}`
        : "/api/v1/expenses"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.amount,
          categoryId: form.categoryId,
          merchant: form.merchant || undefined,
          description: form.description || undefined,
          expenseDate: form.expenseDate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Gagal menyimpan")
        return
      }

      toast.success(editingId ? "Pengeluaran diubah" : "Pengeluaran ditambahkan")
      resetForm()
      await fetchExpenses()
    } catch {
      toast.error("Gagal menyimpan pengeluaran")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus pengeluaran ini?")) return
    try {
      const res = await fetch(`/api/v1/expenses/${id}`, { method: "DELETE" })
      if (res.ok) {
        setExpenses((prev) => prev.filter((e) => e.id !== id))
        toast.success("Pengeluaran dihapus")
      }
    } catch {
      toast.error("Gagal menghapus")
    }
  }

  async function handleCopy(expense: Expense) {
    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: expense.amount,
          categoryId: expense.category.id,
          merchant: expense.merchant || undefined,
          description: expense.description || undefined,
          expenseDate: new Date().toISOString().split("T")[0],
        }),
      })

      if (res.ok) {
        setCopiedId(expense.id)
        toast.success("Pengeluaran diduplikasi")
        await fetchExpenses()
        setTimeout(() => setCopiedId(null), 2000)
      }
    } catch {
      toast.error("Gagal menduplikasi")
    }
  }

  const currentMonthTotal = expenses.reduce(
    (sum, e) => sum + Number(e.amount), 0
  )

  // Group by month
  const grouped = expenses.reduce(
    (groups, e) => {
      const d = new Date(e.expenseDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!groups[key]) groups[key] = { label: format(d, "MMMM yyyy", { locale: id }), expenses: [], total: 0 }
      groups[key].expenses.push(e)
      groups[key].total += Number(e.amount)
      return groups
    },
    {} as Record<string, { label: string; expenses: Expense[]; total: number }>,
  )
  const sortedMonths = Object.keys(grouped).sort().reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <FadeIn>
        <div className="rounded-3xl bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Periode {periodLabel}</p>
          <p className="text-2xl font-bold">{formatCurrency(currentMonthTotal)}</p>
        </div>
      </FadeIn>

      {/* Tombol tambah */}
      <FadeIn>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="size-4" />
          Tambah Pengeluaran
        </Button>
      </FadeIn>

      {/* Drawer form */}
      <Drawer.Root
        open={showForm}
        onOpenChange={(open) => { if (!open) resetForm() }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-4xl flex-col rounded-t-3xl bg-card pb-8 pt-3 focus:outline-none">
            <div className="mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
            <div className="overflow-y-auto px-4 flex-1 min-h-0">
              <h3 className="mb-3 font-medium">
                {editingId ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3" onPointerDown={(e) => e.stopPropagation()}>
                {/* Jumlah */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Jumlah (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <input
                      ref={amountRef}
                      type="text"
                      inputMode="numeric"
                      value={form.amount ? Number(form.amount).toLocaleString("id-ID") : ""}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full rounded-xl border border-input py-2 pl-9 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      placeholder="0"
                    />
                    {form.amount && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, amount: "" })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Merchant */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Merchant
                  </label>
                  <MerchantInput
                    value={form.merchant}
                    onChange={(m) => setForm({ ...form, merchant: m })}
                    onSuggestionSelect={handleMerchantSelect}
                    placeholder="Cari atau ketik merchant..."
                  />
                </div>

                {/* Kategori — grid button */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {categories.map((cat) => {
                      const selected = form.categoryId === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setForm({ ...form, categoryId: cat.id })}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all dark:bg-zinc-800 ${
                            selected
                              ? "border-2 font-medium shadow-sm"
                              : "bg-secondary/50 hover:bg-secondary"
                          }`}
                          style={{
                            borderColor: selected ? (cat.color || "#6b7280") : undefined,
                            backgroundColor: selected ? `${cat.color || "#6b7280"}10` : undefined,
                          }}
                        >
                          <div
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color || "#6b7280" }}
                          />
                          <span className="truncate text-xs">{cat.name}</span>
                          {selected && <Check className="ml-auto size-3 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                  {form.merchant && form.categoryId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kategori otomatis disarankan dari merchant
                    </p>
                  )}
                </div>

                {/* Tanggal */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full rounded-xl border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </div>

                {/* Deskripsi — textarea */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Deskripsi
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full resize-none rounded-xl border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    placeholder="Opsional"
                    rows={2}
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2 pt-1">
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    {editingId ? "Simpan" : "Tambah"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Daftar pengeluaran */}
      {sortedMonths.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Belum ada pengeluaran
        </p>
      ) : (
        sortedMonths.map((key) => {
          const items = grouped[key].expenses
          const limit = visibleCounts[key] || 10
          const visible = items.slice(0, limit)
          const hidden = items.length - visible.length

          return (
          <div key={key}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                {grouped[key].label}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                {formatCurrency(grouped[key].total)}
              </p>
            </div>
            <StaggerList className="space-y-2">
              {visible.map((expense) => (
                <StaggerItem key={expense.id}>
                  <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:gap-3 sm:px-4 sm:py-3"
                >
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white sm:size-9 sm:text-xs"
                    style={{
                      backgroundColor: expense.category.color || "#6b7280",
                    }}
                  >
                    {expense.category.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {expense.merchant || expense.description || expense.category.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {expense.category.name}
                      {expense.description && expense.merchant
                        ? ` - ${expense.description}`
                        : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold sm:text-sm">
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    <p className="text-[11px] text-muted-foreground sm:text-xs">
                      {format(new Date(expense.expenseDate), "d MMM", {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-0.5 sm:gap-1">
                    <button
                      onClick={() => handleCopy(expense)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:p-1.5"
                      title="Duplikat dengan tanggal hari ini"
                    >
                      {copiedId === expense.id ? (
                        <Check className="size-3.5 text-primary sm:size-4" />
                      ) : (
                        <Copy className="size-3.5 sm:size-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(expense)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:p-1.5"
                    >
                      <Pencil className="size-3.5 sm:size-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:p-1.5"
                    >
                      <Trash2 className="size-3.5 sm:size-4" />
                    </button>
                  </div>
                </div>
                </StaggerItem>
              ))}
            </StaggerList>
            {hidden > 0 && (
              <button
                onClick={() => setVisibleCounts((prev) => ({ ...prev, [key]: (prev[key] || 10) + 10 }))}
                className="mt-1 w-full rounded-xl border border-dashed py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                Tampilkan 10 lainnya ({hidden} tersisa)
              </button>
            )}
          </div>
          )
        })
      )}
    </div>
  )
}
