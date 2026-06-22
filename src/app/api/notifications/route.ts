import { NextRequest, NextResponse } from "next/server"
import { getNotificationPayload } from "@/lib/notification-data"

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "5")
    const payload = await getNotificationPayload(limit)

    return NextResponse.json(payload)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}
