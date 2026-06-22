import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const readNotificationSchema = z.object({
  id: z.string().min(1, "Notification id is required"),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = readNotificationSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid notification payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.update({
      where: { id: parsed.data.id },
      data: { isRead: true },
      select: {
        id: true,
        isRead: true,
      },
    })

    return NextResponse.json({ success: true, notification })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 })
  }
}
