import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Providers } from "@/components/providers"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenRouter Model Browser",
  description: "Browse all available AI models from OpenRouter",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            <div className="min-h-screen bg-background">
              <header className="border-b">
                <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                  <div className="font-semibold text-xl">OpenRouter Model Browser</div>
                  <ModeToggle />
                </div>
              </header>
              {children}
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
