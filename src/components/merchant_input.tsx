"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronDown } from "lucide-react"

type MerchantInputProps = {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect?: (merchant: string) => void
  placeholder?: string
}

export default function MerchantInput({
  value,
  onChange,
  onSuggestionSelect,
  placeholder = "Cari merchant...",
}: MerchantInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function fetchSuggestions(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 1) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/merchants?q=${encodeURIComponent(q)}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data)
          setOpen(data.length > 0)
          setHighlightIdx(-1)
        }
      } catch {
        console.error("Failed to fetch merchants")
      }
    }, 150)
  }

  function handleInput(v: string) {
    onChange(v)
    fetchSuggestions(v)
  }

  function selectSuggestion(s: string) {
    onChange(s)
    setOpen(false)
    setSuggestions([])
    onSuggestionSelect?.(s)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        onSuggestionSelect?.(value)
      }
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlightIdx >= 0) {
        selectSuggestion(suggestions[highlightIdx])
      } else {
        onSuggestionSelect?.(value)
        setOpen(false)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("")
              setSuggestions([])
              setOpen(false)
            }}
            className="absolute right-2 rounded p-0.5 text-zinc-400 hover:text-zinc-600"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => selectSuggestion(s)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === highlightIdx ? "bg-sky-100" : "hover:bg-sky-50"
              }`}
            >
              <ChevronDown className="size-3 rotate-[-90deg] text-zinc-400" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
