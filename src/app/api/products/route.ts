import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductAddedNotification, ensureAutoNotifications } from '@/lib/notifications'
import { productSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page') ?? '1')
    const limit = Number(searchParams.get('limit') ?? '10')
    const search = searchParams.get('search')?.trim() ?? ''
    const categoryId = searchParams.get('categoryId')?.trim() ?? ''

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { supplier: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const product = await prisma.product.create({
      data: parsed.data,
      include: {
        category: true,
      },
    })

    await createProductAddedNotification(prisma, product)
    await ensureAutoNotifications()

    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

