'use client'

import { useMemo } from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StoreLogoMark } from "@/components/store/store-logo-mark"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import type { TransactionRecord } from "@/components/transactions/types"
import type { StoreProfileExportPayload } from "@/types"
import { Download, Printer, X } from "lucide-react"
import jsPDF from "jspdf"

interface TransactionDetailModalProps {
  open: boolean
  onClose: () => void
  transaction: TransactionRecord | null
  storeProfile: StoreProfileExportPayload
}

function exportTransactionPdf(transaction: TransactionRecord, storeProfile: StoreProfileExportPayload) {
  const doc = new jsPDF()
  let y = 18

  if (storeProfile.logoUrl) {
    try {
      doc.addImage(storeProfile.logoUrl, "PNG", 14, y - 4, 18, 18)
    } catch {
      try {
        doc.addImage(storeProfile.logoUrl, "JPEG", 14, y - 4, 18, 18)
      } catch {
        // Keep PDF export working even if the logo format cannot be embedded.
      }
    }
  }

  doc.setFontSize(16)
  doc.text(`Detail Transaksi ${storeProfile.storeName}`, storeProfile.logoUrl ? 38 : 14, y)
  y += 10

  doc.setFontSize(10)
  const rows = [
    ["Toko", storeProfile.storeName],
    ["Alamat", storeProfile.address || "-"],
    ["Telepon", storeProfile.phoneNumber || storeProfile.whatsappNumber || "-"],
    ["Invoice", transaction.invoiceNumber],
    ["Tanggal", new Date(transaction.createdAt).toLocaleString("id-ID")],
    ["Kasir", transaction.cashierName],
    ["Pelanggan", transaction.customerName],
    ["Metode", transaction.paymentMethod],
    ["Status", transaction.status],
  ]

  rows.forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y)
    y += 6
  })

  y += 4
  doc.text("Item Produk", 14, y)
  y += 8

  transaction.items.forEach((item) => {
    doc.text(
      `${item.productName} | ${item.qtyPack} pack | ${formatCurrency(item.subtotal)}`,
      14,
      y
    )
    y += 6
  })

  y += 6
  doc.text(`Grand Total: ${formatCurrency(transaction.total)}`, 14, y)
  y += 6
  doc.text(`Bayar: ${formatCurrency(transaction.paidAmount)}`, 14, y)
  y += 6
  doc.text(`Kembalian: ${formatCurrency(transaction.changeAmount)}`, 14, y)
  y += 8
  doc.text(storeProfile.receiptFooter || "Terima kasih sudah berbelanja.", 14, y)

  doc.save(`${transaction.invoiceNumber}.pdf`)
}

export function TransactionDetailModal({
  open,
  onClose,
  transaction,
  storeProfile,
}: TransactionDetailModalProps) {
  const totals = useMemo(() => {
    if (!transaction) return null

    return {
      grandTotal: transaction.total,
      paymentAmount: transaction.paidAmount,
      changeReturned: transaction.changeAmount,
    }
  }, [transaction])

  if (!open || !transaction || !totals) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <Card className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_28px_80px_-36px_rgba(15,23,42,0.18)] dark:border-slate-800/70 dark:bg-slate-950/95">
        <CardHeader className="border-b border-slate-200/80 pb-5 dark:border-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-950 dark:text-white">
                Detail Transaksi
              </CardTitle>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {transaction.invoiceNumber} •{" "}
                {new Date(transaction.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => exportTransactionPdf(transaction, storeProfile)}
              >
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Cetak
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="max-h-[calc(90vh-108px)] space-y-6 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="flex items-center gap-3">
                <StoreLogoMark
                  logoUrl={storeProfile.logoUrl}
                  storeName={storeProfile.storeName}
                  className="h-12 w-12"
                  iconClassName="h-5 w-5"
                />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Toko
                  </p>
                  <p className="mt-1 font-semibold text-slate-950 dark:text-white">
                    {storeProfile.storeName}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Kasir
              </p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-white">
                {transaction.cashierName}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Pelanggan
              </p>
              <p className="mt-2 font-semibold text-slate-950 dark:text-white">
                {transaction.customerName}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Pembayaran
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {transaction.paymentMethod}
                </Badge>
                <Badge className="rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            {storeProfile.logoUrl ? (
              <div className="mb-3 flex justify-start">
                <Image
                  src={storeProfile.logoUrl}
                  alt={`Logo ${storeProfile.storeName}`}
                  width={52}
                  height={52}
                  unoptimized
                  className="rounded-2xl border border-slate-200/90 bg-white p-2 object-contain dark:border-slate-800 dark:bg-slate-950/80"
                />
              </div>
            ) : null}
            {storeProfile.receiptFooter || "Terima kasih sudah berbelanja di toko kami."}
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/55">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800 dark:text-white">
                  <TableHead>Produk</TableHead>
                  <TableHead>Qty Pack</TableHead>
                  <TableHead>Total Kg</TableHead>
                  <TableHead>Harga/Kg</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-100"
                  >
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.qtyPack}</TableCell>
                    <TableCell>{item.totalWeightKg.toFixed(2)} kg</TableCell>
                    <TableCell>{formatCurrency(item.pricePerKg)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Ringkasan
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Diskon</span>
                  <span>Rp0</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak</span>
                  <span>Rp0</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950 dark:border-slate-800 dark:text-white">
                  <span>Grand Total</span>
                  <span>{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Pembayaran
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Jumlah Bayar</span>
                  <span>{formatCurrency(totals.paymentAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950 dark:border-slate-800 dark:text-white">
                  <span>Kembalian</span>
                  <span>{formatCurrency(totals.changeReturned)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
