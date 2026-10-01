import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | Irraya Fashion",
  description: "Securely complete your Irraya Fashion order.",
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
