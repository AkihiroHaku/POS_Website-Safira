'use client'

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type Attribute } from "next-themes"

interface SidebarProviderProps {
  children: React.ReactNode
  attribute?: Attribute
  defaultTheme?: string
}

export function SidebarProvider({
  children,
  attribute = "class",
  defaultTheme = "dark",
}: SidebarProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  )
}
