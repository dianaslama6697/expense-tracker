import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const prismaAdapter = PrismaAdapter(prisma)

const adapter = {
  ...prismaAdapter,
  linkAccount: (data: Record<string, unknown>) => {
    const { access_token, refresh_token, expires_at, token_type, id_token, session_state, ...rest } = data
    return prismaAdapter.linkAccount({
      ...rest,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expires_at,
      tokenType: token_type,
      idToken: id_token,
      sessionState: session_state,
    })
  },
  createSession: (data: Record<string, unknown>) => {
    const { session_token, user_id, ...rest } = data
    return prismaAdapter.createSession({
      ...rest,
      sessionToken: session_token,
      userId: user_id,
    })
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
})
