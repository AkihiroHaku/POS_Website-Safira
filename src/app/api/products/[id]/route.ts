import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureAutoNotifications } from '@/lib/notifications'
import { productSchema } from '@/lib/validators'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid product payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (parsed.data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parsed.data.categoryId },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Kategori yang dipilih tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    })

    await ensureAutoNotifications()

    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactionItems: true,
            stockLogs: true,
          },
        },
      },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (existingProduct._count.transactionItems > 0) {
      return NextResponse.json(
        {
          error: 'Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi.',
          details: {
            transactionItems: existingProduct._count.transactionItems,
          },
        },
        { status: 409 }
      )
    }

    await prisma.$transaction([
      prisma.stockLog.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ])

    await ensureAutoNotifications()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

