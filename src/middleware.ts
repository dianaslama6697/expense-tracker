import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
  const isLoggedIn = !!req.auth

  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    "/((?!login|api/auth|api/v1/auth/register|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)",
  ],
}
