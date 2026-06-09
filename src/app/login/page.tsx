"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (registering) {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Gagal mendaftar")
        setLoading(false)
        return
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    window.location.href = "/"
  }

  function handleGoogle() {
    signIn("google", { redirectTo: "/" })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f4f7] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-bold">Expense Tracker</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          {registering
            ? "Buat akun baru"
            : "Masuk untuk mengelola pengeluaran"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {registering && (
            <input
              type="text"
              placeholder="Nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {registering ? "Daftar" : "Masuk"}
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs text-zinc-400">
            <span className="bg-white px-2">atau</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
        >
          Login dengan Google
        </Button>

        <button
          type="button"
          onClick={() => {
            setRegistering(!registering)
            setError("")
          }}
          className="mt-4 w-full text-center text-sm text-zinc-500 hover:text-zinc-700"
        >
          {registering
            ? "Sudah punya akun? Masuk"
            : "Belum punya akun? Daftar"}
        </button>
      </div>
    </div>
  )
}
