"use client"

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react"
import { usePathname } from "next/navigation"
import { Camera, Loader2, ImageIcon, Sparkles } from "lucide-react"
import { Drawer } from "vaul"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import MerchantInput from "@/components/merchant_input"

type OCRResult = {
  merchant: string
  amount: number
  date: string
  categoryId: string | null
  categoryName: string
  description: string
  items: { name: string; price: number; quantity: number }[]
}

type Category = {
  id: string
  name: string
  icon: string | null
  color: string | null
}

export type ScanReceiptHandle = {
  openPicker: () => void
}

type ScanReceiptProps = {
  onSuccess?: () => void
  onScanned?: () => void
  showFab?: boolean
}

const ScanReceipt = forwardRef<ScanReceiptHandle, ScanReceiptProps>(
  function ScanReceipt({ onSuccess, onScanned, showFab = true }, ref) {
  const pathname = usePathname()
  const hideFab = !showFab || pathname.startsWith("/split-bill") || pathname.startsWith("/pockets") || pathname.startsWith("/split/")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState<
    "idle" | "uploading" | "processing" | "done"
  >("idle")
  const [imagePreview, setImagePreview] = useState("")
  const [receiptId, setReceiptId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [merchant, setMerchant] = useState("")
  const [amount, setAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [ocrItems, setOcrItems] = useState<{ name: string; price: number; quantity: number }[]>([])
  const [saving, setSaving] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    openPicker: () => setShowPicker(true),
  }))

  useEffect(() => {
    const handler = () => setShowPicker(true)
    window.addEventListener("open-scanner", handler)
    return () => window.removeEventListener("open-scanner", handler)
  }, [])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/v1/categories")
        if (res.ok) setCategories(await res.json())
      } catch {
        console.error("Failed to fetch categories")
      }
    }
    fetchCategories()
  }, [])

  function reset() {
    setStep("idle")
    setImagePreview("")
    setReceiptId("")
    setMerchant("")
    setAmount("")
    setExpenseDate("")
    setCategoryId("")
    setDescription("")
    setOcrItems([])
    setSaving(false)
    setDrawerOpen(false)
    setShowPicker(false)
  }

  async function handleFile(file: File | null) {
    if (!file) return

    setShowPicker(false)
    setStep("uploading")
    setDrawerOpen(true)
    setImagePreview(URL.createObjectURL(file))

    try {
      // Upload + OCR dalam 1 request (pake buffer original)
      setStep("processing")
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/v1/receipts/scan", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Scan gagal")
      }

      const data = await res.json()
      setReceiptId(data.receiptId)
      setMerchant(data.merchant || "")
      setAmount(data.amount ? String(data.amount) : "")
      setExpenseDate(data.date || new Date().toISOString().split("T")[0])
      setCategoryId(data.categoryId || "")
      setDescription(data.description || "")
      setOcrItems(data.items || [])
      setStep("done")

      toast.success("Struk berhasil diproses")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal scan struk"
      )
      reset()
    }
  }

  async function handleSave() {
    if (!amount || !categoryId) {
      toast.error("Jumlah dan kategori wajib diisi")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/v1/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          categoryId,
          merchant: merchant || undefined,
          description: description || undefined,
          expenseDate,
          receiptId,
          source: "ocr",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan")
      }

      toast.success("Pengeluaran dari struk berhasil disimpan")
      onSuccess?.()
      onScanned?.()
      window.dispatchEvent(new Event("refresh-data"))
      reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {/* Picker popup */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setShowPicker(false)}>
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 dark:bg-zinc-900 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-medium">
              Ambil dari mana?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <Camera className="size-5 text-sky-600 dark:text-sky-400" />
                <span>Ambil Foto</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <ImageIcon className="size-5 text-sky-600 dark:text-sky-400" />
                <span>Pilih dari Gallery</span>
              </button>
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="mt-3 w-full py-2 text-sm text-zinc-500 dark:text-zinc-400"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      {!hideFab && (
        <button
          onClick={() => setShowPicker(true)}
          className="fixed bottom-20 right-6 z-[60] flex size-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label="Scan struk"
        >
          <Camera className="size-6" />
        </button>
      )}

      {/* Drawer hasil scan */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={(o) => {
          if (o) {
            setDrawerOpen(true)
            return
          }
          if (step !== "uploading" && step !== "processing") {
            reset()
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" onClick={() => { if (step !== "uploading" && step !== "processing") reset() }} />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-4xl rounded-t-[16px] bg-white px-4 pb-8 pt-3 focus:outline-none dark:bg-zinc-900">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />

            {/* Loading states */}
            {step === "uploading" && (
              <div className="flex flex-col items-center py-10">
                <Loader2 className="mb-3 size-8 animate-spin text-sky-600 dark:text-sky-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Mengupload gambar...</p>
              </div>
            )}

            {step === "processing" && (
              <div className="flex flex-col items-center py-10">
                <Sparkles className="mb-3 size-8 animate-pulse text-amber-500" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Membaca struk dengan AI...
                </p>
              </div>
            )}

            {/* Form hasil OCR */}
            {step === "done" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview struk"
                      className="size-20 shrink-0 rounded-xl border object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">Hasil Scan</h3>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 dark:text-zinc-400">
                      Periksa kembali data sebelum menyimpan
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Merchant
                    </label>
                    <MerchantInput
                      value={merchant}
                      onChange={setMerchant}
                      onSuggestionSelect={setMerchant}
                      placeholder="Nama toko..."
                    />
                  </div>

                  {ocrItems.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Item Pesanan
                      </label>
                      <div className="space-y-2">
                        {ocrItems.map((item, i) => {
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 dark:bg-zinc-800"
                            >
                              <span className="text-sm font-medium">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                  {item.quantity > 1 && `${item.quantity} × `}
                                  {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                  }).format(item.price)}
                                </span>
                                <span className="text-sm font-semibold">
                                  {new Intl.NumberFormat("id-ID", {
                                    style: "currency",
                                    currency: "IDR",
                                    minimumFractionDigits: 0,
                                  }).format(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Kategori
                      </label>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      >
                        <option value="">Pilih kategori</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                      placeholder="Opsional"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="size-4 animate-spin" />}
                    Simpan Pengeluaran
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
})
export default ScanReceipt
