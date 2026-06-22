import { NextResponse } from "next/server"
import { getNotificationPayload } from "@/lib/notification-data"

export async function POST() {
  try {
    const payload = await getNotificationPayload(5)
    return NextResponse.json({ success: true, ...payload })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create auto notifications" }, { status: 500 })
  }
}
