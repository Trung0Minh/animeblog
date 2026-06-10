import type { PrismaClient } from "@prisma/client"
import { clsx, type ClassValue } from "clsx"
import { slug as githubSlug } from "github-slugger"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function generateSlug(title: string): string {
  const normalized = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  return githubSlug(normalized)
}

export async function ensureUniqueSlug(
  baseSlug: string,
  prisma: PrismaClient,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing || existing.id === excludeId) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}
