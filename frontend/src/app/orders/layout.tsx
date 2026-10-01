import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Orders | Irraya Fashion",
  description: "View and track your Irraya Fashion orders.",
}

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return children
}
