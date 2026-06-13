import { revalidateTag } from "next/cache"

import { getActiveSession, unauthorizedResponse } from "@/lib/authz"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const activeSession = await getActiveSession(["ADMIN"])

  if (!activeSession) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const writer = await prisma.user.findUnique({
      select: { id: true, role: true },
      where: { id },
    })

    if (!writer) {
      return Response.json({ error: "Writer not found" }, { status: 404 })
    }

    if (writer.role === "ADMIN") {
      return Response.json(
        { error: "Cannot remove admin accounts" },
        { status: 400 },
      )
    }

    const postCount = await prisma.post.count({ where: { authorId: id } })

    if (postCount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          data: { role: "REVOKED" },
          select: { id: true },
          where: { id },
        }),
        prisma.session.deleteMany({ where: { userId: id } }),
        prisma.account.deleteMany({ where: { userId: id } }),
      ])
    } else {
      await prisma.user.delete({
        select: { id: true },
        where: { id },
      })
    }

    revalidateTag("users", "max")

    return Response.json({ data: { message: "Writer access removed" } })
  } catch (error) {
    console.error("[DELETE /api/admin/writers/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
