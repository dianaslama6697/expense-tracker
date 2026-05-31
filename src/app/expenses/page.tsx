"use client"

import { useState, useCallback } from "react"
import QuickAdd from "@/components/quick_add"
import ExpenseList from "@/components/expense_list"

export default function ExpensesPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleQuickAddSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <div className="space-y-6">
      <QuickAdd onSuccess={handleQuickAddSuccess} />
      <ExpenseList key={refreshKey} />
    </div>
  )
}
