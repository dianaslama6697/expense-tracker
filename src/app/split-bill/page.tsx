"use client"

import { useState, useRef, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check,
  Loader2,
  Camera,
  Share2,
  ImageIcon,
  ShoppingBag,
  Users,
  Calculator,
  Sparkles,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Item = {
  tempId: string
  name: string
  price: number
  quantity: number
}

type Person = {
  tempId: string
  name: string
  itemQtys: Record<string, number>
}

let tempIdCounter = 0
function nextTempId() {
  return `tmp_${++tempIdCounter}`
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

function calculatePerPerson(
  items: Item[],
  persons: Person[],
  tax: number,
  serviceCharge: number
) {
  const totalItems = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const personItemTotals: Record<string, number> = {}
  const totalAssignedQtys: Record<string, number> = {}

  for (const p of persons) {
    let total = 0
    for (const item of items) {
      const qty = p.itemQtys[item.tempId] || 0
      if (qty > 0) {
        total += item.price * qty
        totalAssignedQtys[item.tempId] = (totalAssignedQtys[item.tempId] || 0) + qty
      }
    }
    personItemTotals[p.tempId] = total
  }

  const unassignedTotal = items.reduce((s, i) => {
    const assigned = totalAssignedQtys[i.tempId] || 0
    const unassigned = Math.max(0, i.quantity - assigned)
    return s + i.price * unassigned
  }, 0)

  const personCount = persons.length || 1
  const unassignedShare = unassignedTotal / personCount
  const taxableTotal = totalItems || 1
  const totalTax = tax + serviceCharge

  const result = persons.map((p) => {
    const itemTotal = personItemTotals[p.tempId] || 0
    const subtotal = itemTotal + unassignedShare
    const personTax = (subtotal / taxableTotal) * totalTax
    return {
      person: p,
      itemTotal,
      unassignedShare,
      tax: personTax,
      grandTotal: subtotal + personTax,
    }
  })

  return { result, unassignedTotal, totalItems, grandTotal: totalItems + totalTax }
}

export default function SplitBillPage() {
  const [step, setStep] = useState(1)
  const [merchant, setMerchant] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [tax, setTax] = useState(0)
  const [serviceCharge, setServiceCharge] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedCode, setSavedCode] = useState("")

  // Scan state
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Item input
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [newItemQty, setNewItemQty] = useState("1")
  const [personName, setPersonName] = useState("")

  // Expense sync
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0])
  const [myPersonId, setMyPersonId] = useState("")
  const [expenseCategoryId, setExpenseCategoryId] = useState("")
  const [categories, setCategories] = useState<{ id: string; name: string; color: string | null }[]>([])

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.ok && r.json())
      .then((data) => {
        if (data) setCategories(data)
      })
  }, [])

  function resetAll() {
    setStep(1)
    setMerchant("")
    setItems([])
    setPersons([])
    setTax(0)
    setServiceCharge(0)
    setSaving(false)
    setSavedCode("")
    setNewItemName("")
    setNewItemPrice("")
    setNewItemQty("1")
    setPersonName("")
    setExpenseDate(new Date().toISOString().split("T")[0])
    setMyPersonId("")
    setExpenseCategoryId("")
  }

  async function handleScanFile(file: File | null) {
    if (!file) return
    setScanning(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/v1/receipts/scan", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Scan gagal")
      const data = await res.json()
      if (data.merchant) setMerchant(data.merchant)
      const mappedItems = data.items?.length
        ? data.items.map((i: { name: string; price: number; quantity?: number }) => ({
            tempId: nextTempId(),
            name: i.name,
            price: i.price,
            quantity: i.quantity || 1,
          }))
        : data.amount
          ? [{ tempId: nextTempId(), name: "Item 1", price: Number(data.amount), quantity: 1 }]
          : []
      setItems(mappedItems)
      toast.success("Struk berhasil diproses")
    } catch {
      toast.error("Gagal scan struk")
    } finally {
      setScanning(false)
    }
  }

  function addItem() {
    if (!newItemName || !newItemPrice) return
    setItems([...items, { tempId: nextTempId(), name: newItemName, price: Number(newItemPrice), quantity: Number(newItemQty) || 1 }])
    setNewItemName("")
    setNewItemPrice("")
    setNewItemQty("1")
  }

  function removeItem(tempId: string) {
    setItems(items.filter((i) => i.tempId !== tempId))
    setPersons(persons.map((p) => {
      const { [tempId]: _, ...rest } = p.itemQtys
      return { ...p, itemQtys: rest }
    }))
  }

  function addPerson() {
    const name = personName.trim()
    if (!name) return
    setPersons([...persons, { tempId: nextTempId(), name, itemQtys: {} }])
    setPersonName("")
  }

  function removePerson(tempId: string) {
    setPersons(persons.filter((p) => p.tempId !== tempId))
  }

  function toggleItem(personId: string, itemId: string) {
    setPersons(persons.map((p) => {
      if (p.tempId !== personId) return p
      const current = p.itemQtys[itemId] || 0
      const item = items.find((i) => i.tempId === itemId)
      const maxQty = item?.quantity || 1

      const assignedByOthers = persons
        .filter((op) => op.tempId !== personId)
        .reduce((sum, op) => sum + (op.itemQtys[itemId] || 0), 0)
      const remaining = Math.max(0, maxQty - assignedByOthers)

      const next = current >= remaining ? 0 : current + 1

      return {
        ...p,
        itemQtys: { ...p.itemQtys, [itemId]: next },
      }
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/v1/split-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          totalAmount: items.reduce((s, i) => s + i.price * i.quantity, 0),
          tax,
          serviceCharge,
          items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
          persons: persons.map((p) => ({
            name: p.name,
            itemQtys: Object.fromEntries(
              Object.entries(p.itemQtys)
                .filter(([_, qty]) => qty > 0)
                .map(([itemId, qty]) => [
                  String(items.findIndex((i) => i.tempId === itemId)),
                  qty,
                ])
                .filter(([idx]) => Number(idx) >= 0)
            ),
          })),
        }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      const data = await res.json()
      setSavedCode(data.shareCode)
      toast.success("Split bill berhasil disimpan!")

      // Simpan expense untuk person "saya"
      if (myPersonId && expenseCategoryId) {
        const me = persons.find((p) => p.tempId === myPersonId)
        if (me) {
          const myTotal = items.reduce((s, i) => s + i.price * (me.itemQtys[i.tempId] || 0), 0)
          if (myTotal > 0) {
            const expRes = await fetch("/api/v1/expenses", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                amount: myTotal,
                categoryId: expenseCategoryId,
                merchant: merchant || undefined,
                description: `Split bill ${merchant}`,
                expenseDate,
                source: "manual",
              }),
            })
            if (expRes.ok) {
              toast.success("Pengeluaranmu sudah dicatat!")
            }
          }
        }
      }
    } catch {
      toast.error("Gagal menyimpan split bill")
    } finally {
      setSaving(false)
    }
  }

  function shareWhatsApp() {
    if (!savedCode) return
    const url = `${window.location.origin}/split/${savedCode}`
    const msg = encodeURIComponent(`Hai! Lihat rincian split bill ${merchant} di sini:\n${url}`)
    window.open(`https://wa.me/?text=${msg}`, "_blank")
  }

  const steps = [
    { num: 1, label: "Item", icon: ShoppingBag },
    { num: 2, label: "Orang", icon: Users },
    { num: 3, label: "Assign", icon: Check },
    { num: 4, label: "Ringkasan", icon: Calculator },
  ]

  const calc = calculatePerPerson(items, persons, tax, serviceCharge)

  return (
    <div className="mx-auto max-w-lg">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleScanFile(e.target.files?.[0] ?? null)} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleScanFile(e.target.files?.[0] ?? null)} />

      {/* Step indicator */}
      {!savedCode && (
        <div className="mb-4 flex items-center justify-center gap-2">
          {steps.map((s) => {
            const Icon = s.icon
            const isActive = step === s.num
            const isDone = step > s.num
            return (
              <div key={s.num} className="flex items-center gap-1">
                <div className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${isActive ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : isDone ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"}`}>
                  {isDone ? <Check className="size-3.5" /> : s.num}
                </div>
                <span className={`text-[11px] ${isActive ? "font-medium text-gray-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500 dark:text-zinc-500"}`}>{s.label}</span>
                {s.num < 4 && <ChevronRight className="size-3 text-zinc-300 dark:text-zinc-600" />}
              </div>
            )
          })}
        </div>
      )}

      {scanning && (
        <div className="flex flex-col items-center py-10">
          <Sparkles className="mb-3 size-8 animate-pulse text-amber-500" />
          <p className="text-sm text-zinc-500 dark:text-zinc-500">Memproses struk...</p>
        </div>
      )}

      {savedCode ? (
        <div className="rounded-2xl border bg-white dark:bg-zinc-900 p-6 text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-6 text-emerald-600" />
          </div>
          <p className="mb-1 font-medium">Split bill siap dibagikan!</p>
          <p className="mb-4 text-xs text-zinc-400 dark:text-zinc-500">{merchant}</p>
          <div className="mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-500 break-all">
            {window.location.origin}/split/{savedCode}
          </div>
          <div className="flex gap-2">
            <Button onClick={shareWhatsApp} className="flex-1">
              <Share2 className="mr-1.5 size-4" />
              Bagikan ke WhatsApp
            </Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/split/${savedCode}`); toast.success("Link disalin!") }}>
              Salin Link
            </Button>
          </div>
          <Button variant="ghost" onClick={resetAll} className="mt-3 w-full text-sm text-zinc-400 dark:text-zinc-500">
            Buat Split Bill Baru
          </Button>
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border bg-white dark:bg-zinc-900 p-4">
          {/* Scan button */}
          {step === 1 && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                <ImageIcon className="mr-1.5 size-4" />
                Gallery
              </Button>
              <Button variant="outline" onClick={() => cameraInputRef.current?.click()} className="flex-1">
                <Camera className="mr-1.5 size-4" />
                Kamera
              </Button>
            </div>
          )}

          {/* Step 1: Items */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-500">Merchant</label>
                <input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="Nama tempat..." />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-500">Tanggal</label>
                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-500">Pajak (Rp)</label>
                  <input type="number" value={tax || ""} onChange={(e) => setTax(Number(e.target.value) || 0)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="0" min="0" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-500">Service Charge (Rp)</label>
                  <input type="number" value={serviceCharge || ""} onChange={(e) => setServiceCharge(Number(e.target.value) || 0)} className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="0" min="0" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500">Item Pesanan</label>
                {items.map((item) => (
                  <div key={item.tempId} className="flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatCurrency(item.price)}{item.quantity > 1 && ` × ${item.quantity}`}</p>
                    </div>
                    <span className="shrink-0 text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    <button onClick={() => removeItem(item.tempId)} className="shrink-0 rounded p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 hover:text-red-500"><X className="size-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-[1fr_80px_60px] gap-2">
                <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="Nama item" />
                <input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} className="w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="Harga" min="0" />
                <input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value || "1")} className="w-full min-w-0 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="Qty" min="1" />
              </div>
              <Button variant="outline" onClick={addItem} disabled={!newItemName || !newItemPrice} className="w-full"><Plus className="mr-1.5 size-4" />Tambah Item</Button>
            </div>
          )}

          {/* Step 2: People */}
          {step === 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-500">Yang ikut makan</label>
              {persons.map((p) => (
                <div key={p.tempId} className="flex items-center gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2">
                  <div className="flex size-7 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">{p.name.charAt(0).toUpperCase()}</div>
                  <span className="flex-1 text-sm">{p.name}</span>
                  <button
                    onClick={() => setMyPersonId(myPersonId === p.tempId ? "" : p.tempId)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                      myPersonId === p.tempId
                        ? "bg-sky-600 text-white"
                        : "border text-zinc-400 hover:border-sky-300 hover:text-sky-600 dark:text-zinc-500"
                    }`}
                  >
                    {myPersonId === p.tempId ? <><UserCheck className="mr-0.5 inline size-3" />Saya</> : "Ini Saya"}
                  </button>
                  <button onClick={() => removePerson(p.tempId)} className="rounded p-1 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 hover:text-red-500"><X className="size-3.5" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addPerson()} className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500" placeholder="Nama teman..." />
                <Button variant="outline" onClick={addPerson} disabled={!personName.trim()}><Plus className="mr-1.5 size-4" />Tambah</Button>
              </div>
            </div>
          )}

          {/* Step 3: Assign */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-500">Klik item untuk menambah ke orang ini (klik lagi nambah, sampai max/reset). Jumlah total antar orang tidak akan melebihi stok item.</p>
              {persons.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400 dark:text-zinc-500">Tambah orang dulu di langkah sebelumnya</p>
              ) : (
                persons.map((p) => {
                  const personTotal = items.reduce((s, i) => s + i.price * (p.itemQtys[i.tempId] || 0), 0)
                  return (
                    <div key={p.tempId} className="rounded-xl border bg-white dark:bg-zinc-900 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">{p.name.charAt(0).toUpperCase()}</div>
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-500">{formatCurrency(personTotal)}</span>
                      </div>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const qty = p.itemQtys[item.tempId] || 0
                          return (
                            <button
                              key={item.tempId}
                              onClick={() => toggleItem(p.tempId, item.tempId)}
                              className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${qty > 0 ? "bg-sky-50 dark:bg-sky-950/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/70"}`}
                            >
                              <span className="flex-1 text-sm dark:text-zinc-100">{item.name}</span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">{item.quantity > 1 ? `${item.quantity} × ${formatCurrency(item.price)}` : formatCurrency(item.price)}</span>
                              {qty > 0 ? (
                                <span className="flex size-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white dark:bg-white dark:text-gray-900">{qty}</span>
                              ) : (
                                <span className="flex size-6 items-center justify-center rounded-full border text-xs text-zinc-300 dark:text-zinc-600">+</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border bg-white dark:bg-zinc-900 p-3">
                <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-500">Total Item</span><span className="font-medium">{formatCurrency(calc.totalItems)}</span></div>
                {tax > 0 && <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-500">Pajak</span><span className="font-medium">{formatCurrency(tax)}</span></div>}
                {serviceCharge > 0 && <div className="flex items-center justify-between text-sm"><span className="text-zinc-500 dark:text-zinc-500">Service Charge</span><span className="font-medium">{formatCurrency(serviceCharge)}</span></div>}
                <div className="mt-1 flex items-center justify-between border-t pt-1 text-sm font-bold"><span>Total</span><span>{formatCurrency(calc.grandTotal)}</span></div>
              </div>

              {myPersonId && (() => {
                const me = persons.find((p) => p.tempId === myPersonId)
                const myTotal = me ? items.reduce((s, i) => s + i.price * (me.itemQtys[i.tempId] || 0), 0) : 0
                if (myTotal > 0) {
                  return (
                    <div className="rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-900/50 dark:bg-sky-950/30 p-3">
                      <p className="mb-2 text-xs font-medium text-sky-700 dark:text-sky-400">Pengeluaran untuk {me?.name}:</p>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-semibold">{merchant}</span>
                        <span className="font-bold">{formatCurrency(Math.round(myTotal))}</span>
                      </div>
                      <select
                        value={expenseCategoryId}
                        onChange={(e) => setExpenseCategoryId(e.target.value)}
                        className="w-full rounded-xl border px-3 py-1.5 text-xs dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        <option value="">Pilih kategori...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )
                }
                return null
              })()}
              {calc.result.map((r) => {
                const personItems = items
                  .filter((i) => (r.person.itemQtys[i.tempId] || 0) > 0)
                  .map((i) => ({ ...i, qty: r.person.itemQtys[i.tempId] }))
                return (
                <div key={r.person.tempId} className="rounded-xl border bg-white dark:bg-zinc-900 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">{r.person.name.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-medium">{r.person.name}</span>
                    <span className="ml-auto text-sm font-bold">{formatCurrency(Math.round(r.grandTotal))}</span>
                  </div>
                  {personItems.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {personItems.map((item) => (
                        <div key={item.tempId} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600">{item.name}{item.qty > 1 && ` ×${item.qty}`}</span>
                          <span className="text-zinc-500 dark:text-zinc-500">{formatCurrency(item.price * item.qty)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                    <p>Pesanan: {formatCurrency(Math.round(r.itemTotal))}</p>
                    {r.unassignedShare > 0 && <p>Bagi rata: {formatCurrency(Math.round(r.unassignedShare))}</p>}
                    {calc.totalItems > 0 && <p>Pajak+SC: {formatCurrency(Math.round(r.tax))}</p>}
                  </div>
                </div>
                )
              })}
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between gap-2 pt-2">
            {step > 1 ? <Button variant="outline" onClick={() => setStep(step - 1)}><ChevronLeft className="mr-1 size-4" />Sebelumnya</Button> : <div />}
            {step < 4 ? (
              <Button onClick={() => {
                if (step === 1 && items.length === 0) { toast.error("Minimal 1 item"); return }
                if (step === 2 && persons.length < 2) { toast.error("Minimal 2 orang"); return }
                setStep(step + 1)
              }}>Selanjutnya<ChevronRight className="ml-1 size-4" /></Button>
            ) : (
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-1.5 size-4 animate-spin" />}
                Simpan & Bagikan
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
