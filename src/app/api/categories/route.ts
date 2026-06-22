import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categorySchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim() ?? ''
    const categories = await prisma.category.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }]
    })
    return NextResponse.json(categories)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = categorySchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data kategori tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const normalizedName = parsed.data.name.trim()
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan. Gunakan nama lain.' },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        description: parsed.data.description,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 })
  }
}

