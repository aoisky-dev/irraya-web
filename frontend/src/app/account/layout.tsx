import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Account | Irraya Fashion",
  description: "Manage your Irraya account, addresses, and preferences.",
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children
}
