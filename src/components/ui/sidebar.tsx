'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

export function Sidebar({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <aside className={cn("w-64 min-h-screen border-r bg-white dark:bg-slate-950", className)}>
      {children}
    </aside>
  )
}

export function SidebarContent({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("p-4 space-y-4", className)}>{children}</div>
}

export function SidebarGroup({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

export function SidebarGroupLabel({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn("px-2 text-sm font-semibold text-slate-500", className)}>
      {children}
    </h3>
  )
}

export function SidebarGroupContent({
  children
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}

export function SidebarMenu({
  children
}: {
  children: React.ReactNode
}) {
  return <div className="space-y-1">{children}</div>
}

export function SidebarMenuItem({
  children
}: {
  children: React.ReactNode
}) {
  return <div>{children}</div>
}

export function SidebarMenuButton({
  children,
  asChild: _asChild
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  void _asChild
  return <div className="rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">{children}</div>
}
