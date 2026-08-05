"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addMonths, subMonths, parseISO } from "date-fns"
import { id as localeId } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar } from "lucide-react"
import { Drawer } from "vaul"
import QuickAdd from "@/components/quick_add"
import { toast } from "sonner"

type ExpenseItem = {
  id: string
  amount: number
  merchant: string | null
  category: { id: string; name: string; color: string | null }
}

type CalendarDay = {
  date: string
  day: string
  hasExpense: boolean
  dayTotal: number
  expenses: ExpenseItem[]
  isCurrentMonth: boolean
  isToday: boolean
}

type CalendarData = {
  month: string
  year: number
  monthNumber: number
  days: CalendarDay[]
  totalMonth: number
  expenseCount: number
}

export default function CalendarPage() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const fetchCalendar = useCallback(async (m: number, y: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/calendar?month=${m + 1}&year=${y}`)
      if (res.ok) setData(await res.json())
    } catch {
      toast.error("Gagal memuat data kalender")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendar(currentMonth.month, currentMonth.year)
  }, [currentMonth, fetchCalendar])

  function prevMonth() {
    setCurrentMonth((prev) => {
      const newDate = subMonths(new Date(prev.year, prev.month, 1), 1)
      return { month: newDate.getMonth(), year: newDate.getFullYear() }
    })
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      const newDate = addMonths(new Date(prev.year, prev.month, 1), 1)
      return { month: newDate.getMonth(), year: newDate.getFullYear() }
    })
  }

  function selectDate(day: CalendarDay) {
    if (!day.isCurrentMonth) return
    setSelectedDate(day.date)
  }

  function handleCloseQuickAdd() {
    setShowQuickAdd(false)
    fetchCalendar(currentMonth.month, currentMonth.year)
  }

  function getDayForDate(dateStr: string) {
    return data?.days.find((d) => d.date === dateStr) ?? null
  }

  const weekdays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

  // Split days into weeks for calendar grid
  const weeks: CalendarDay[][] = []
  if (data) {
    let currentWeek: CalendarDay[] = []
    for (const day of data.days) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>Data kalender tidak tersedia</p>
      </div>
    )
  }

  // Get selected day data
  const selectedDay = selectedDate ? getDayForDate(selectedDate) : null
  const selectedDateLabel = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: localeId })
    : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Kalender</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{data.month}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="rounded-lg p-2 hover:bg-secondary transition-colors"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 hover:bg-secondary transition-colors"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total bulan ini</p>
            <p className="text-xl font-bold">
              Rp{data.totalMonth.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Transaksi</p>
            <p className="text-xl font-bold">{data.expenseCount}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min((data.expenseCount / 31) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {data.expenseCount}/31 hari
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day) => (
                <button
                  key={day.date}
                  onClick={() => selectDate(day)}
                  disabled={!day.isCurrentMonth}
                  className={`
                    relative flex flex-col items-center justify-center rounded-xl py-2 transition-all
                    ${!day.isCurrentMonth
                      ? "opacity-30 cursor-default"
                      : selectedDate === day.date
                      ? "bg-primary/20 ring-2 ring-primary cursor-pointer"
                      : day.hasExpense
                      ? "bg-primary/10 hover:bg-primary/20 cursor-pointer active:scale-95"
                      : "hover:bg-secondary cursor-pointer active:scale-95"
                    }
                    ${day.isToday && selectedDate !== day.date
                      ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                      : ""
                    }
                  `}
                >
                  <span className={`text-sm ${day.isToday ? "font-bold text-primary" : "font-medium"}`}>
                    {day.day}
                  </span>
                  {day.hasExpense && (
                    <div className="mt-0.5 flex flex-col items-center">
                      <div className="flex gap-0.5">
                        {day.expenses.slice(0, 3).map((exp, i) => (
                          <div
                            key={i}
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: exp.category.color || "#6b7280" }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-foreground">
                        {formatCurrency(day.dayTotal)}
                      </span>
                    </div>
                  )}
                  {!day.hasExpense && day.isCurrentMonth && (
                    <div className="mt-1 size-1 rounded-full bg-muted-foreground/30" />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-primary/40" />
            <span>Sudah diisi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-muted-foreground/30" />
            <span>Belum diisi</span>
          </div>
        </div>
      </div>

      {/* Expense List for Selected Date */}
      {selectedDay && (
        <div className="space-y-3">
          {/* Selected date header */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium">
                {selectedDay.hasExpense ? "Pengeluaran Hari Ini" : "Belum Ada Pengeluaran"}
              </p>
              <p className="text-xs text-muted-foreground">{selectedDateLabel}</p>
            </div>
            <button
              onClick={() => setShowQuickAdd(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Plus className="size-3" />
              Tambah
            </button>
          </div>

          {/* Expense items */}
          {selectedDay.hasExpense ? (
            <div className="space-y-2">
              {selectedDay.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 shadow-sm"
                >
                  <div
                    className="size-8 shrink-0 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${exp.category.color}20` }}
                  >
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: exp.category.color || "#6b7280" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {exp.merchant || exp.category.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{exp.category.name}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    Rp{exp.amount.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
              <div className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Total hari ini</p>
                <p className="text-base font-bold">
                  Rp{selectedDay.dayTotal.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-8 text-center">
              <div className="mb-3 rounded-full bg-secondary p-3">
                <Calendar className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Belum ada pengeluaran</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan pengeluaran untuk tanggal ini
              </p>
            </div>
          )}
        </div>
      )}
      {/* Quick Add Drawer */}
      <Drawer.Root
        open={showQuickAdd}
        onOpenChange={(open) => {
          if (!open) setShowQuickAdd(false)
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md flex-col rounded-t-2xl bg-card focus:outline-none">
            <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 min-h-0">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setShowQuickAdd(false)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                  Kembali
                </button>
                <div className="text-right">
                  <p className="text-xs font-medium">Tambah Pengeluaran</p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedDate && format(parseISO(selectedDate), "EEEE, d MMMM yyyy", { locale: localeId })}
                  </p>
                </div>
              </div>
              <QuickAdd
                onSuccess={handleCloseQuickAdd}
                selectedDate={selectedDate ?? undefined}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
