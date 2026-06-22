'use client'

import * as React from "react"
import Link from "next/link"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Home, Package, ShoppingBag, FileText, Settings, Tags } from "lucide-react"
import { db } from "@/lib/db"

export function AppSidebar() {
  const [storeName, setStoreName] = React.useState("Kasir Toko Safina")

  React.useEffect(() => {
    db.storeProfile.findFirst()
      .then(data => { if (data?.storeName) setStoreName(data.storeName) })
      .catch(() => { /* silent fail, keep default name */ })
  }, [])

  return (
    <Sidebar>
      <SidebarContent className="p-2">
        <SidebarGroup className="mb-4">
<SidebarGroupLabel className="flex items-center gap-2 p-3 font-bold text-lg text-emerald-600">
            <Package className="h-6 w-6" />
            <span>{storeName}</span>
          </SidebarGroupLabel>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Umum</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/products">
                    <Package className="h-4 w-4 mr-2" />
                    <span>Produk</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/categories">
                    <Tags className="h-4 w-4 mr-2" />
                    <span>Kategori</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Transaksi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/cashier">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    <span>Kasir</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/transactions">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Laporan</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/store-settings">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Profil Toko</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}


