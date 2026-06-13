import type { Role } from "@prisma/client"
import type { Session } from "next-auth"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface ActiveSessionUser {
  avatarUrl: string | null
  email: string
  id: string
  name: string
  role: Role
  username: string
}

export interface ActiveSession {
  session: Session
  user: ActiveSessionUser
}

export async function getActiveSession(
  allowedRoles?: readonly Role[],
): Promise<ActiveSession | null> {
  const session = await auth()

  if (!session?.user.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    select: {
      avatarUrl: true,
      email: true,
      id: true,
      name: true,
      role: true,
      username: true,
    },
    where: { id: session.user.id },
  })

  if (!user || user.role === "REVOKED") {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return { session, user }
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 })
}
