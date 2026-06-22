'use client'

import { useMemo, useState } from "react"
import jsPDF from "jspdf"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn, formatCurrency } from "@/lib/utils"
import type {
  PaymentMethodLabel,
  QuickFilter,
  TopSellingProduct,
  TransactionRecord,
  TransactionStatus,
} from "@/components/transactions/types"
import type { StoreProfileExportPayload } from "@/types"
import {
  CalendarRange,
  Download,
  Eye,
  FileDown,
  Printer,
  ReceiptText,
  Search,
} from "lucide-react"
import { TransactionDetailModal } from "@/components/transactions/transaction-detail-modal"

const pageSize = 8

interface TransactionTableProps {
  transactions: TransactionRecord[]
  topProducts: TopSellingProduct[]
  storeProfile: StoreProfileExportPayload
}

function isInsideQuickRange(date: Date, quickFilter: QuickFilter) {
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)

  if (quickFilter === "today") return date >= start

  if (quickFilter === "week") {
    const weekStart = new Date(start)
    weekStart.setDate(start.getDate() - 6)
    return date >= weekStart
  }

  if (quickFilter === "month") {
    const monthStart = new Date(start)
    monthStart.setDate(1)
    return date >= monthStart
  }

  return true
}

function exportTransactionsCsv(transactions: TransactionRecord[], storeName: string) {
  const headers = ["Invoice", "Tanggal", "Kasir", "Pelanggan", "Jumlah Item", "Total", "Metode", "Status"]
  const rows = transactions.map((t) => [
    t.invoiceNumber,
    new Date(t.createdAt).toLocaleString("id-ID"),
    t.cashierName,
    t.customerName,
    String(t.itemCount),
    String(t.total),
    t.paymentMethod,
    t.status,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `laporan-transaksi-${storeName.toLowerCase().replace(/\s+/g, "-")}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function exportTransactionsPdf(transactions: TransactionRecord[], storeProfile: StoreProfileExportPayload) {
  const doc = new jsPDF({ orientation: "landscape" })
  let y = 16

  if (storeProfile.logoUrl) {
    try {
      doc.addImage(storeProfile.logoUrl, "PNG", 14, 8, 18, 18)
    } catch {
      try { doc.addImage(storeProfile.logoUrl, "JPEG", 14, 8, 18, 18) } catch { /* skip */ }
    }
  }

  doc.setFontSize(16)
  doc.text(`Laporan Transaksi ${storeProfile.storeName}`, storeProfile.logoUrl ? 38 : 14, y)
  y += 10
  doc.setFontSize(9)

  if (storeProfile.address || storeProfile.phoneNumber || storeProfile.whatsappNumber) {
    doc.text(
      [storeProfile.address, storeProfile.phoneNumber || storeProfile.whatsappNumber].filter(Boolean).join(" | "),
      14, y
    )
    y += 8
  }

  transactions.forEach((t) => {
    const line = [t.invoiceNumber, new Date(t.createdAt).toLocaleDateString("id-ID"), t.paymentMethod, t.status, formatCurrency(t.total)].join(" | ")
    doc.text(line, 14, y)
    y += 6
    if (y >= 190) { doc.addPage(); y = 16 }
  })

  doc.save(`laporan-transaksi-${storeProfile.storeName.toLowerCase().replace(/\s+/g, "-")}.pdf`)
}

const paymentOptions: Array<PaymentMethodLabel | "all"> = ["all", "Tunai", "QRIS", "Transfer"]
const statusOptions: Array<TransactionStatus | "all"> = ["all", "Selesai", "Pending", "Dibatalkan"]

export function TransactionTable({ transactions, topProducts, storeProfile }: TransactionTableProps) {
  const [invoiceQuery, setInvoiceQuery] = useState("")
  const [customerQuery, setCustomerQuery] = useState("")
  const [cashierQuery, setCashierQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all")
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethodLabel | "all">("all")
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRecord | null>(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const createdAt = new Date(t.createdAt)
      return (
        t.invoiceNumber.toLowerCase().includes(invoiceQuery.toLowerCase()) &&
        t.customerName.toLowerCase().includes(customerQuery.toLowerCase()) &&
        t.cashierName.toLowerCase().includes(cashierQuery.toLowerCase()) &&
        (selectedDate ? createdAt.toISOString().slice(0, 10) === selectedDate : true) &&
        isInsideQuickRange(createdAt, quickFilter) &&
        (paymentFilter === "all" ? true : t.paymentMethod === paymentFilter) &&
        (statusFilter === "all" ? true : t.status === statusFilter)
      )
    })
  }, [cashierQuery, customerQuery, invoiceQuery, paymentFilter, quickFilter, selectedDate, statusFilter, transactions])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const currentRows = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.5fr]">
        {/* ─── Riwayat Transaksi Card ─── */}
        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-xl" style={{ color: 'var(--foreground)' }}>
                  Riwayat Transaksi
                </CardTitle>
                <p className="mt-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  Monitor seluruh invoice yang sudah masuk lengkap dengan detail penjualan.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="gap-2" onClick={() => exportTransactionsCsv(filteredTransactions, storeProfile.storeName)}>
                  <Download className="h-4 w-4" />
                  Export Excel
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={() => exportTransactionsPdf(filteredTransactions, storeProfile)}>
                  <FileDown className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button type="button" className="gap-2" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Laporan
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4" style={{ color: 'var(--foreground-muted)' }} />
                <Input className="pl-10" placeholder="Cari invoice..." value={invoiceQuery}
                  onChange={(e) => { setInvoiceQuery(e.target.value); setPage(1) }} />
              </div>
              <Input placeholder="Cari pelanggan..." value={customerQuery}
                onChange={(e) => { setCustomerQuery(e.target.value); setPage(1) }} />
              <Input placeholder="Cari kasir..." value={cashierQuery}
                onChange={(e) => { setCashierQuery(e.target.value); setPage(1) }} />
              <div className="relative">
                <CalendarRange className="absolute left-4 top-3.5 h-4 w-4" style={{ color: 'var(--foreground-muted)' }} />
                <Input type="date" className="pl-10" value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setPage(1) }} />
              </div>
              <div className="flex flex-wrap gap-2 xl:col-span-2">
                {[
                  { key: "all", label: "Semua" },
                  { key: "today", label: "Hari Ini" },
                  { key: "week", label: "Minggu Ini" },
                  { key: "month", label: "Bulan Ini" },
                ].map((item) => (
                  <Button key={item.key} type="button" variant={quickFilter === item.key ? "default" : "outline"} size="sm"
                    onClick={() => { setQuickFilter(item.key as QuickFilter); setPage(1) }}>
                    {item.label}
                  </Button>
                ))}
              </div>
              <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v as PaymentMethodLabel | "all"); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Metode Pembayaran" /></SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((o) => <SelectItem key={o} value={o}>{o === "all" ? "Semua Metode" : o}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TransactionStatus | "all"); setPage(1) }}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => <SelectItem key={o} value={o}>{o === "all" ? "Semua Status" : o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-[26px] border" style={{ borderColor: 'var(--border)' }}>
              <Table>
                <TableHeader>
                  <TableRow
                    style={{
                      borderColor: 'var(--border)',
                      backgroundColor: 'var(--surface-muted)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Invoice</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Tanggal</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Kasir</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Jumlah Item</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Total Belanja</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Metode</TableHead>
                    <TableHead style={{ color: 'var(--foreground-muted)' }}>Status</TableHead>
                    <TableHead className="text-right" style={{ color: 'var(--foreground-muted)' }}>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentRows.length === 0 ? (
                    <TableRow style={{ borderColor: 'var(--border)', color: 'var(--foreground-soft)' }}>
                      <TableCell colSpan={8} className="h-28 text-center">
                        Tidak ada transaksi yang cocok dengan filter saat ini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentRows.map((t) => (
                      <TableRow key={t.id} style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                        <TableCell className="font-semibold">{t.invoiceNumber}</TableCell>
                        <TableCell>
                          {new Date(t.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                        </TableCell>
                        <TableCell>{t.cashierName}</TableCell>
                        <TableCell>{t.itemCount}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(t.total)}</TableCell>
                        <TableCell>
                          <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {t.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-full border-0 px-3 py-1",
                            t.status === "Selesai" && "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
                            t.status === "Pending" && "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                            t.status === "Dibatalkan" && "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                          )}>
                            {t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTransaction(t)}>
                              <Eye className="mr-2 h-4 w-4" /> Detail
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedTransaction(t); setTimeout(() => window.print(), 50) }}>
                              <Printer className="mr-2 h-4 w-4" /> Cetak
                            </Button>
                            <Button type="button" size="sm" onClick={() => exportTransactionsPdf([t], storeProfile)}>
                              <FileDown className="mr-2 h-4 w-4" /> PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                Menampilkan{" "}
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{currentRows.length}</span>{" "}
                dari{" "}
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{filteredTransactions.length}</span>{" "}
                transaksi
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Sebelumnya
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Selanjutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Produk Terlaris Card ─── */}
        <Card
          className="rounded-[30px] border"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', boxShadow: 'var(--shadow-card)' }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl" style={{ color: 'var(--foreground)' }}>
              <ReceiptText className="h-5 w-5 text-emerald-500" />
              Produk Terlaris
            </CardTitle>
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Top 5 produk paling banyak terjual dari riwayat transaksi.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.length === 0 ? (
              <div
                className="rounded-[24px] border p-4 text-sm"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)', color: 'var(--foreground-muted)' }}
              >
                Belum ada data penjualan produk untuk ditampilkan.
              </div>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-[24px] border p-4"
                  style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-muted)' }}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--foreground-muted)' }}>
                      #{index + 1}
                    </p>
                    <p className="mt-1 truncate font-semibold" style={{ color: 'var(--foreground)' }}>
                      {product.name}
                    </p>
                  </div>
                  <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    {product.quantitySold} pack
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionDetailModal
        open={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        storeProfile={storeProfile}
      />
    </>
  )
}
