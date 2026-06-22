import "./globals.css"
import Navbar from "@/components/layout/navbar"
import { SidebarProvider } from "@/components/layout/sidebar-provider"
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SidebarProvider attribute="class" defaultTheme="dark">
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <main>{children}</main>

            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
              toastOptions={{
                style: {
                  background: "var(--surface)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-soft)",
                },
              }}
            />
          </div>
        </SidebarProvider>
      </body>
    </html>
  )
}

