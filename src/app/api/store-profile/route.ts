import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { defaultStoreProfile, getStoreProfile } from '@/lib/store-profile'
import { storeProfileSchema } from '@/lib/validators'

export async function GET() {
  try {
    const profile = await getStoreProfile()
    return NextResponse.json(profile)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal memuat profil toko' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const parsed = storeProfileSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Data profil toko tidak valid', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const existingProfile = await prisma.storeProfile.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    const sanitizedPayload = {
      ...defaultStoreProfile,
      ...parsed.data,
      logoUrl: parsed.data.logoUrl ?? null,
    }

    const profile = existingProfile
      ? await prisma.storeProfile.update({
          where: { id: existingProfile.id },
          data: sanitizedPayload,
        })
      : await prisma.storeProfile.create({
          data: sanitizedPayload,
        })

    return NextResponse.json(profile)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal menyimpan profil toko' }, { status: 500 })
  }
}
