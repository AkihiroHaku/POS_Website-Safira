import { create } from 'zustand'
import { CartItem } from '@/types'

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateQty: (productId: string, qty: number) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const qtyPack = Math.max(0, Math.floor(item.qtyPack))
    if (qtyPack <= 0) {
      return
    }

    const { items } = get()
    const existing = items.find((i) => i.product.id === item.product.id)
    const availableStock = item.product.stockPack

    if (existing) {
      const nextQty = Math.min(availableStock, existing.qtyPack + qtyPack)
      set({
        items: items.map((i) =>
          i.product.id === item.product.id ? { ...i, qtyPack: nextQty } : i
        ),
      })
    } else {
      set({ items: [...items, { ...item, qtyPack: Math.min(qtyPack, availableStock) }] })
    }
  },
  updateQty: (productId, qty) => {
    const normalizedQty = Math.max(0, Math.floor(qty))

    set({
      items: get()
        .items.map((i) => {
          if (i.product.id !== productId) return i
          return { ...i, qtyPack: Math.min(normalizedQty, i.product.stockPack) }
        })
        .filter((i) => i.qtyPack > 0),
    })
  },
  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product.id !== productId) })
  },
  clearCart: () => set({ items: [] }),
  getTotal: () =>
    get().items.reduce(
      (sum, item) =>
        sum + item.qtyPack * item.product.weightPerPack * item.product.sellingPricePerKg,
      0
    ),
}))

