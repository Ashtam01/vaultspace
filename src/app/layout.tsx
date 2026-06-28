import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "VaultSpace",
  description:
    "Multi-tenant team workspace with enterprise-grade RBAC, ABAC, and ReBAC permissions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased dark">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
