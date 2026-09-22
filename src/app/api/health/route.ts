import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()

  try {
    // Test database connectivity
    await prisma.$queryRaw`SELECT 1`

    const [productCount, categoryCount, transactionCount] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.transaction.count(),
    ])

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: 'connected',
      counts: {
        products: productCount,
        categories: categoryCount,
        transactions: transactionCount,
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        database: 'disconnected',
        error: 'Database connection failed',
      },
      { status: 503 }
    )
  }
}
