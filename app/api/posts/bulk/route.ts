import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, postIds } = await req.json()
    if (!Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: "No posts selected" }, { status: 400 })
    }

    if (action === "DELETE") {
      await prisma.post.deleteMany({
        where: { id: { in: postIds } },
      })
    } else if (action === "ARCHIVE") {
      await prisma.post.updateMany({
        where: { id: { in: postIds } },
        data: { status: "ARCHIVED" },
      })
    } else if (action === "UNARCHIVE") {
      await prisma.post.updateMany({
        where: { id: { in: postIds } },
        data: { status: "DRAFT" },
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 })
  }
}
