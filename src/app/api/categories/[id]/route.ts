import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validators'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const parsed = categorySchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data kategori tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: parsed.data.name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (duplicateCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan. Gunakan nama lain.' },
        { status: 409 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        {
          error: 'Kategori tidak bisa dihapus karena masih dipakai oleh produk.',
          details: { productsCount: category._count.products },
        },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 })
  }
}
