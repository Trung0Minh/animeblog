import { nanoid } from "nanoid"

import { auth } from "@/lib/auth"
import { uploadToR2 } from "@/lib/r2"

const ALLOWED_MIME_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
])
const MAX_BYTES = 10 * 1024 * 1024
const MIME_EXTENSION: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

function getFileExtension(file: File) {
  const parts = file.name.split(".")
  const extension = parts.length > 1 ? parts.pop()?.toLowerCase() : undefined

  return extension || MIME_EXTENSION[file.type] || "bin"
}

function getFolder(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return "uploads"
  }

  const folder = value.trim().replace(/^\/+|\/+$/g, "")

  if (folder.includes("..") || !/^[A-Za-z0-9/_-]+$/.test(folder)) {
    return "uploads"
  }

  return folder
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const form = await request.formData()
    const file = form.get("file")
    const folder = getFolder(form.get("folder"))

    if (!(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        { error: "Only JPEG, PNG, GIF, and WebP images are allowed" },
        { status: 400 },
      )
    }

    if (file.size > MAX_BYTES) {
      return Response.json(
        { error: "File must be 10 MB or smaller" },
        { status: 400 },
      )
    }

    const key = `${folder}/${nanoid()}.${getFileExtension(file)}`
    const body = Buffer.from(await file.arrayBuffer())
    const url = await uploadToR2({ body, contentType: file.type, key })

    return Response.json({ data: { url } }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/upload]", error)
    return Response.json({ error: "Upload failed" }, { status: 500 })
  }
}
