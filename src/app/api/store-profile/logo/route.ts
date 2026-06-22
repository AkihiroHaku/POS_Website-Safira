import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStoreProfile } from '@/lib/store-profile'

export async function DELETE() {
  try {
    const profile = await getStoreProfile()

    const updatedProfile = await prisma.storeProfile.update({
      where: { id: profile.id },
      data: {
        logoUrl: null,
      },
    })

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal menghapus logo toko' }, { status: 500 })
  }
}
