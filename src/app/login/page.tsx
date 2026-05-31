import { signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Expense Tracker</h1>
        <p className="text-muted-foreground text-sm">
          Masuk untuk mengelola pengeluaran Anda
        </p>
        <form
          action={async () => {
            "use server"
            await signIn("google", { redirectTo: "/" })
          }}
        >
          <Button type="submit" variant="default" size="lg">
            Login dengan Google
          </Button>
        </form>
      </div>
    </div>
  )
}
