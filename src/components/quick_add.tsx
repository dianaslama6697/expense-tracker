"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Loader2, Check, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion_wrappers"
import MerchantInput from "@/components/merchant_input"

type CategoryWithUsage = {
  id: string
  name: string
  icon: string | null
  color: string | null
  usageCount: number
}

type QuickAddProps = {
  onSuccess?: () => void
}

export default function QuickAdd({ onSuccess }: QuickAddProps) {
  const [amount, setAmount] = useState("")
  const [merchant, setMerchant] = useState("")
  const [categories, setCategories] = useState<CategoryWithUsage[]>([])
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/v1/categories/usage")
        if (res.ok) setCategories(await res.json())
      } catch {
        console.error("Failed to fetch categories")
      }
    }
    fetchCategories()
    inputRef.current?.focus()
  }, [])

  const fetchCategorySuggestion = useCallback(async (m: string) => {
    if (!m) {
      setSuggestedCategoryId(null)
      return
    }
    try {
      const res = await fetch(`/api/v1/merchants/suggest?merchant=${encodeURIComponent(m)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.id) {
          setSuggestedCategoryId(data.id)
        } else {
          setSuggestedCategoryId(null)
        }
      }
    } catch {
      setSuggestedCategoryId(null)
    }
  }, [])

  function handleMerchantChange(m: string) {
    setMerchant(m)
  }

  function handleMerchantSelect(m: string) {
    setMerchant(m)
    fetchCategorySuggestion(m)
  }

  function formatAmountInput(v: string) {
    const digits = v.replace(/\D/g, "")
    setAmount(digits)
  }

  async function handleCategorySelect(categoryId: string) {
    setSaving(true)
    setError("")

    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          categoryId,
          merchant: merchant || undefined,
          expenseDate: new Date().toISOString().split("T")[0],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Gagal menyimpan")
        setSaving(false)
        return
      }

      toast.success("Pengeluaran ditambahkan")
      setDone(true)
      onSuccess?.()
      setTimeout(() => {
        setDone(false)
        setAmount("")
        setMerchant("")
        setSuggestedCategoryId(null)
        setError("")
        setSaving(false)
        inputRef.current?.focus()
      }, 1200)
    } catch {
      setError("Gagal menyimpan")
      setSaving(false)
    }
  }

  if (done) {
    return (
      <FadeIn>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 text-emerald-700">
            <Check className="size-5" />
            <span className="text-sm font-medium">
              Berhasil menambah Rp{Number(amount).toLocaleString("id-ID")}
              {merchant && ` — ${merchant}`}
            </span>
          </div>
        </div>
      </FadeIn>
    )
  }

  const numAmount = Number(amount)
  const canSave = amount && numAmount > 0

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="space-y-3">
        {/* Baris: nominal + merchant */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex flex-1 items-center gap-2 rounded-xl border px-3 py-2">
            <span className="text-sm font-semibold text-zinc-400">Rp</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={amount ? Number(amount).toLocaleString("id-ID") : ""}
              onChange={(e) => formatAmountInput(e.target.value)}
              placeholder="Nominal..."
              className="flex-1 border-0 bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-300"
            />
            {amount && (
              <button
                type="button"
                onClick={() => {
                  setAmount("")
                  setError("")
                }}
                className="rounded p-0.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1">
            <MerchantInput
              value={merchant}
              onChange={handleMerchantChange}
              onSuggestionSelect={handleMerchantSelect}
              placeholder="Merchant (opsional)"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Kategori */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Pilih kategori</p>
            {suggestedCategoryId && (
              <span className="flex items-center gap-1 text-xs text-amber-600">
                <Sparkles className="size-3" />
                otomatis dari merchant
              </span>
            )}
          </div>
          <StaggerList className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {categories.map((cat) => {
              const isSuggested = suggestedCategoryId === cat.id
              const isSavingTarget = saving && suggestedCategoryId === cat.id
              return (
                <StaggerItem key={cat.id}>
                <button
                  onClick={() => handleCategorySelect(cat.id)}
                  disabled={saving && !isSavingTarget}
                  className={`relative flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                    isSuggested
                      ? "border-2 font-medium shadow-sm"
                      : "hover:border-sky-300 hover:bg-sky-50"
                  } ${saving && !isSavingTarget ? "pointer-events-none opacity-50" : ""}`}
                  style={{
                    borderColor: isSuggested ? (cat.color || "#6b7280") : undefined,
                    backgroundColor: isSuggested ? `${cat.color || "#6b7280"}10` : undefined,
                  }}
                >
                  {isSavingTarget && saving ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <div
                      className="flex size-3.5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: cat.color || "#6b7280" }}
                    >
                      <div className="size-1 rounded-full bg-white" />
                    </div>
                  )}
                  <span className="truncate text-xs">{cat.name}</span>
                  {isSuggested && (
                    <Sparkles className="ml-auto size-3 shrink-0 text-amber-500" />
                  )}
                </button>
                </StaggerItem>
              )
            })}
          </StaggerList>
        </div>

        {/* Tombol simpan (shortcut: pencet kategori langsung simpen) */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-400">
            Klik kategori untuk menyimpan
          </p>
          {suggestedCategoryId && canSave && (
            <Button
              size="sm"
              onClick={() => handleCategorySelect(suggestedCategoryId)}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Simpan cepat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
