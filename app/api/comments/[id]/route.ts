import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const comment = await prisma.comment.findUnique({
      select: { id: true },
      where: { id },
    })

    if (!comment) {
      return Response.json({ error: "Comment not found" }, { status: 404 })
    }

    await prisma.comment.update({
      data: { status: "SPAM" },
      where: { id },
    })

    return Response.json({ data: { message: "Comment hidden" } })
  } catch (error) {
    console.error("[DELETE /api/comments/[id]]", error)
    return Response.json({ error: "Something went wrong" }, { status: 500 })
  }
}
