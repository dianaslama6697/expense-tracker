import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return
      const defaultCategories = [
        { name: "Makanan & Minuman", icon: "utensils-crossed", color: "#ef4444" },
        { name: "Transportasi", icon: "car", color: "#f97316" },
        { name: "Belanja", icon: "shopping-bag", color: "#eab308" },
        { name: "Hiburan", icon: "gamepad-2", color: "#22c55e" },
        { name: "Tagihan", icon: "file-text", color: "#3b82f6" },
        { name: "Kesehatan", icon: "heart-pulse", color: "#ec4899" },
        { name: "Pendidikan", icon: "book-open", color: "#8b5cf6" },
        { name: "Lainnya", icon: "more-horizontal", color: "#6b7280" },
      ]
      await prisma.category.createMany({
        data: defaultCategories.map((cat) => ({
          userId: user.id!,
          ...cat,
          isDefault: true,
        })),
      })
    },
  },
  callbacks: {
    session({ session, token }) {
      if (session.user) session.user.id = token.sub!
      return session
    },
  },
})

export async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
