"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion_wrappers"
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  ShoppingBag,
  Bell,
  Camera,
  Pencil,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Drawer } from "vaul"
import ScanReceipt, { type ScanReceiptHandle } from "@/components/scan_receipt"

type CategoryItem = {
  categoryId: string
  name: string
  color: string | null
  total: number
  percentage: number
}

type DailyItem = {
  date: string
  day: number
  total: number
}

type BudgetItem = {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string | null
  budgetAmount: number
  spent: number
  remaining: number
  percentage: number
}

type Category = {
  id: string
  name: string
  color: string | null
}

type Insight = {
  type: string
  icon: string
  message: string
}

type ExpenseItem = {
  id: string
  amount: number
  merchant: string | null
  description: string | null
  expenseDate: string
  category: { name: string; color: string | null }
}

type DashboardData = {
  period: { start: string; end: string; days: number }
  currentPeriod: {
    total: number
    count: number
    averagePerDay: number
    daysSoFar: number
  }
  previousPeriod: { total: number; start: string; end: string }
  changePercent: number
  byCategory: CategoryItem[]
  dailyTotals: DailyItem[]
  budgets: BudgetItem[]
  insights: Insight[]
  recentExpenses: ExpenseItem[]
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n)
}

function formatLabel(start: string, end: string) {
  const s = new Date(start + "T00:00:00")
  const e = new Date(end + "T00:00:00")
  if (start === end) return format(s, "d MMMM yyyy", { locale: localeId })
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return format(s, "MMMM yyyy", { locale: localeId })
  }
  return `${format(s, "d MMM", { locale: localeId })} - ${format(e, "d MMM yyyy", { locale: localeId })}`
}

type Preset = "thisMonth" | "lastMonth" | "last3Months" | "thisYear" | "custom"

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<Preset>("thisMonth")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [monthOffset, setMonthOffset] = useState(0)
  const [showCustom, setShowCustom] = useState(false)
  const scanRef = useRef<ScanReceiptHandle>(null)
  const [editingPocket, setEditingPocket] = useState<BudgetItem | null>(null)
  const [pocketAmount, setPocketAmount] = useState("")
  const [savingPocket, setSavingPocket] = useState(false)

  const buildParams = useCallback(() => {
    const now = new Date()
    const params = new URLSearchParams()

    if (preset === "thisMonth") {
      const y = now.getFullYear()
      const m = now.getMonth() + monthOffset
      const s = new Date(y, m, 1)
      const e = new Date(y, m + 1, 0)
      params.set("start", s.toISOString().split("T")[0])
      params.set("end", e.toISOString().split("T")[0])
    } else if (preset === "lastMonth") {
      const y = now.getFullYear()
      const m = now.getMonth() - 1 + monthOffset
      const s = new Date(y, m, 1)
      const e = new Date(y, m + 1, 0)
      params.set("start", s.toISOString().split("T")[0])
      params.set("end", e.toISOString().split("T")[0])
    } else if (preset === "last3Months") {
      const e = new Date(now.getFullYear(), now.getMonth() + 1 + monthOffset, 0)
      const s = new Date(e.getFullYear(), e.getMonth() - 2, 1)
      params.set("start", s.toISOString().split("T")[0])
      params.set("end", e.toISOString().split("T")[0])
    } else if (preset === "thisYear") {
      const y = now.getFullYear()
      params.set("start", `${y}-01-01`)
      params.set("end", `${y}-12-31`)
    } else if (preset === "custom") {
      if (startDate) params.set("start", startDate)
      if (endDate) params.set("end", endDate)
    }

    if (categoryId) params.set("categoryId", categoryId)
    return params
  }, [preset, monthOffset, startDate, endDate, categoryId])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildParams()
      const res = await fetch(`/api/v1/dashboard?${params}`)
      if (res.ok) setData(await res.json())
    } catch {
      console.error("Failed to fetch dashboard")
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  function handlePresetChange(p: Preset) {
    setPreset(p)
    setShowCustom(p === "custom")
    if (p !== "custom") setMonthOffset(0)
  }

  function navigateMonth(dir: 1 | -1) {
    if (preset === "thisMonth" || preset === "lastMonth") {
      setMonthOffset((m) => m + dir)
    }
  }

  async function handleSavePocket() {
    if (!editingPocket) return
    setSavingPocket(true)
    try {
      const amount = Number(pocketAmount.replace(/[^0-9]/g, ""))
      if (!amount) return
      const res = await fetch("/api/v1/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: editingPocket.categoryId || editingPocket.id,
          amount,
        }),
      })
      if (res.ok) {
        setEditingPocket(null)
        fetchData()
      }
    } finally {
      setSavingPocket(false)
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        ) : (
          <p className="text-sm text-zinc-400">Gagal memuat dashboard</p>
        )}
      </div>
    )
  }

  const { currentPeriod, previousPeriod, byCategory, dailyTotals, budgets, insights } =
    data

  const insightIcon = (icon: string) => {
    const icons: Record<string, typeof AlertTriangle> = {
      "trending-up": TrendingUp,
      "trending-down": TrendingDown,
      "alert-circle": AlertCircle,
      "alert-triangle": AlertTriangle,
      "pie-chart": PieChartIcon,
      wallet: Wallet,
      "shopping-bag": ShoppingBag,
      bell: Bell,
    }
    return icons[icon] || Bell
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="space-y-3 rounded-2xl border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5">
          {(["thisMonth", "lastMonth", "last3Months", "thisYear"] as Preset[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
                  preset === p
                    ? "bg-blue-600 text-white"
                    : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                }`}
              >
                {p === "thisMonth"
                  ? "Bulan Ini"
                  : p === "lastMonth"
                    ? "Bulan Lalu"
                    : p === "last3Months"
                      ? "3 Bulan"
                      : "Tahun Ini"}
              </button>
            )
          )}
          <button
            onClick={() => handlePresetChange("custom")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors sm:px-3 sm:text-xs ${
              preset === "custom"
                ? "bg-blue-600 text-white"
                : "bg-sky-100 text-sky-700 hover:bg-sky-200"
            }`}
          >
            Kustom
          </button>
          <button
            onClick={() => scanRef.current?.openPicker()}
            className="ml-auto flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-medium text-white transition-colors hover:bg-blue-700 sm:text-xs"
          >
            <Camera className="size-3.5" />
            Scan Struk
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Navigation for month-based presets */}
          {(preset === "thisMonth" || preset === "lastMonth") && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          {/* Periode label */}
          <p className="text-xs font-semibold sm:text-sm">
            {formatLabel(data.period.start, data.period.end)}
          </p>

          {/* Date range for custom */}
          {showCustom && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border px-3 py-1.5 text-xs sm:min-w-0 sm:flex-none"
              />
              <span className="text-xs text-zinc-400">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border px-3 py-1.5 text-xs sm:min-w-0 sm:flex-none"
              />
            </div>
          )}

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="rounded-xl border px-3 py-1.5 text-xs"
            >
              <option value="">Semua kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Insights */}
      {!loading && insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((insight, i) => {
            const Icon = insightIcon(insight.icon)
            const borderColor =
              insight.type === "warning"
                ? "border-amber-200 bg-amber-50"
                : insight.type === "danger"
                  ? "border-red-200 bg-red-50"
                  : insight.type === "success"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-blue-200 bg-blue-50"
            const textColor =
              insight.type === "warning"
                ? "text-amber-800"
                : insight.type === "danger"
                  ? "text-red-800"
                  : insight.type === "success"
                    ? "text-emerald-800"
                    : "text-blue-800"
            const iconColor =
              insight.type === "warning"
                ? "text-amber-600"
                : insight.type === "danger"
                  ? "text-red-600"
                  : insight.type === "success"
                    ? "text-emerald-600"
                    : "text-blue-600"
            return (
              <div
                key={i}
                className={`flex items-start gap-2 rounded-lg border p-3 ${borderColor}`}
              >
                <Icon className={`mt-0.5 size-4 shrink-0 ${iconColor}`} />
                <p className={`text-sm ${textColor}`}>{insight.message}</p>
              </div>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 animate-spin text-zinc-400" />
        </div>
      ) : (
        <>
          {/* Kartu ringkasan */}
          <FadeIn>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-sky-600">Total</p>
              <p className="text-lg font-bold">
                {formatCurrency(currentPeriod.total)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {currentPeriod.count} transaksi
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-sky-600">Rata-rata / hari</p>
              <p className="text-lg font-bold">
                {formatCurrency(Math.round(currentPeriod.averagePerDay))}
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-sky-600">Periode sebelumnya</p>
              <p className="text-lg font-bold">
                {formatCurrency(previousPeriod.total)}
              </p>
              <div className="mt-1 flex items-center gap-1 text-xs">
                {data.changePercent > 0 ? (
                  <>
                    <TrendingUp className="size-3 text-red-500" />
                    <span className="text-red-500">
                      +{data.changePercent.toFixed(1)}%
                    </span>
                  </>
                ) : data.changePercent < 0 ? (
                  <>
                    <TrendingDown className="size-3 text-green-500" />
                    <span className="text-green-500">
                      {data.changePercent.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span className="text-zinc-400">0%</span>
                )}
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-xs text-sky-600">Hari terlewat</p>
              <p className="text-lg font-bold">
                {currentPeriod.daysSoFar}/{data.period.days}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${(currentPeriod.daysSoFar / data.period.days) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          </FadeIn>

          {/* Grafik per kategori */}
          <FadeIn delay={0.1}>
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <PieChartIcon className="size-4" />
              <h3 className="text-sm font-medium">
                Pengeluaran per Kategori
              </h3>
            </div>
            {byCategory.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Belum ada data
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-center sm:block">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={byCategory.map((c) => ({
                          name: c.name,
                          value: c.total,
                          color: c.color || "#6b7280",
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {byCategory.map((cat) => (
                          <Cell
                            key={cat.categoryId}
                            fill={cat.color || "#6b7280"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {byCategory.map((cat) => (
                    <div key={cat.categoryId}>
                      <div className="mb-0.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="size-2 rounded-full"
                            style={{
                              backgroundColor: cat.color || "#6b7280",
                            }}
                          />
                          <span>{cat.name}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: cat.color || "#6b7280",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </FadeIn>

          {/* Grafik tren harian */}
          <FadeIn delay={0.2}>
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChartIcon className="size-4" />
              <h3 className="text-sm font-medium">Tren Harian</h3>
            </div>
            {dailyTotals.length === 0 ||
            dailyTotals.every((d) => d.total === 0) ? (
              <p className="py-6 text-center text-sm text-zinc-400">
                Belum ada data
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}jt`
                        : v >= 1000
                          ? `${(v / 1000).toFixed(0)}rb`
                          : `${v}`
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Tanggal ${label}`}
                  />
                  <Bar
                    dataKey="total"
                    fill="#2563eb"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          </FadeIn>

          {/* Pocket tracking */}
          {budgets.length > 0 && (
            <div className="rounded-2xl border bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Wallet className="size-4" />
                <h3 className="text-sm font-medium">Kantong</h3>
                <span className="ml-auto text-xs text-zinc-400">
                  Total {formatCurrency(budgets.reduce((s, b) => s + b.remaining, 0))}
                </span>
              </div>
              <div className="space-y-2">
                {budgets.map((b) => {
                  const isOver = b.percentage > 100
                  const isWarning = b.percentage >= 80 && b.percentage <= 100
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setEditingPocket(b)
                        setPocketAmount(String(b.budgetAmount))
                      }}
                      className="w-full rounded-xl border border-transparent bg-zinc-50 p-3 text-left transition-colors hover:border-zinc-200 active:bg-zinc-100"
                    >
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div
                            className="size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: b.categoryColor || "#6b7280" }}
                          />
                          <span className="truncate text-sm font-medium">{b.categoryName}</span>
                        </div>
                        <Pencil className="size-3 shrink-0 text-zinc-300" />
                      </div>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2">
                        <span className={`text-lg font-bold ${isOver ? "text-red-600" : isWarning ? "text-amber-600" : "text-emerald-600"}`}>
                          {formatCurrency(b.remaining)}
                        </span>
                        <span className="text-xs text-zinc-400">
                          dari {formatCurrency(b.budgetAmount)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(b.percentage, 100)}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pocket edit drawer */}
          <Drawer.Root
            open={!!editingPocket}
            onClose={() => setEditingPocket(null)}
          >
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white px-4 pb-8 pt-4 outline-none">
                <Drawer.Handle />
                <div className="mx-auto max-w-sm">
                  <h3 className="mb-1 text-center text-sm font-medium">Atur Kantong</h3>
                  {editingPocket && (
                    <p className="mb-4 text-center text-xs text-zinc-400">
                      {editingPocket.categoryName}
                    </p>
                  )}

                  <div className="relative mb-4">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pocketAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "")
                        setPocketAmount(raw)
                      }}
                      className="w-full rounded-xl border px-8 py-3 text-lg font-semibold text-center focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="0"
                    />
                  </div>

                  <div className="mb-4 flex gap-2">
                    {[500000, 1000000, 1500000, 2000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPocketAmount(String(preset))}
                        className="flex-1 rounded-lg bg-zinc-100 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200"
                      >
                        {formatCurrency(preset)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={savingPocket || !pocketAmount}
                    onClick={handleSavePocket}
                    className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
                  >
                    {savingPocket ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* Pengeluaran terbaru */}
          <div className="rounded-lg border bg-white p-4">
            <h3 className="mb-3 text-sm font-medium">Pengeluaran Terbaru</h3>
            {data.recentExpenses.length === 0 ? (
              <p className="py-3 text-center text-sm text-zinc-400">
                Belum ada pengeluaran
              </p>
            ) : (
              <div className="space-y-2">
                {data.recentExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{
                        backgroundColor: exp.category.color || "#6b7280",
                      }}
                    >
                      {exp.category.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        {exp.merchant || exp.description || exp.category.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(exp.amount))}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {format(
                          new Date(exp.expenseDate),
                          "d MMM",
                          { locale: localeId }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ScanReceipt ref={scanRef} onScanned={fetchData} />
    </div>
  )
}
