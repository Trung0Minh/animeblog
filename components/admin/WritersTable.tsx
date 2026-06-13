"use client"

import { ShieldOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

interface Writer {
  _count: { posts: number }
  createdAt: Date
  email: string
  id: string
  name: string
  username: string
}

function getApiError(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error
  }

  return "Something went wrong"
}

export function WritersTable({ writers }: { writers: Writer[] }) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(writer: Writer) {
    if (
      !confirm(
        `Remove writer access for ${writer.name}? Their published attribution will remain.`,
      )
    ) {
      return
    }

    setRemovingId(writer.id)
    try {
      const response = await fetch(`/api/admin/writers/${writer.id}`, {
        method: "DELETE",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to remove writer")
    } finally {
      setRemovingId(null)
    }
  }

  if (writers.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed p-8 text-center text-sm text-muted-foreground">
        No active writers found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border bg-background">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b bg-muted text-left">
            <th className="px-4 py-3 font-medium">Writer</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Posts</th>
            <th className="px-4 py-3 text-right font-medium">Access</th>
          </tr>
        </thead>
        <tbody>
          {writers.map((writer) => (
            <tr
              className="border-b transition-colors last:border-0 hover:bg-muted/30"
              key={writer.id}
            >
              <td className="px-4 py-3">
                <p className="font-medium">{writer.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  @{writer.username}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {writer.email}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(writer.createdAt)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {writer._count.posts}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  disabled={removingId === writer.id}
                  onClick={() => void handleRemove(writer)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <ShieldOff aria-hidden="true" className="h-4 w-4" />
                  Remove access
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
