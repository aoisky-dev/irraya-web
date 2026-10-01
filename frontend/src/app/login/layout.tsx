import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In | Irraya Fashion",
  description: "Sign in to your Irraya account to manage orders, wishlist, and profile.",
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
