"use client"

import { useEffect, useMemo, useState } from "react"
import type { JSONContent } from "@tiptap/react"

import { cn, generateSlug } from "@/lib/utils"

interface Heading {
  id: string
  level: number
  text: string
}

function getText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  return node.content?.map(getText).join("") ?? ""
}

export function extractHeadings(content: JSONContent): Heading[] {
  const headings: Heading[] = []

  function walk(node: JSONContent) {
    if (node.type === "heading") {
      const level =
        typeof node.attrs?.level === "number" ? node.attrs.level : 2
      const text = getText(node).trim()

      if (text) {
        headings.push({ id: generateSlug(text), level, text })
      }
    }

    node.content?.forEach(walk)
  }

  walk(content)
  return headings
}

interface TableOfContentsProps {
  content: JSONContent
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState("")
  const headings = useMemo(() => extractHeadings(content), [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: "-20% 0% -60% 0%" },
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)

      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length < 2) {
    return null
  }

  return (
    <nav className="sticky top-24 text-sm" aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Contents
      </p>
      <ul className="space-y-1.5">
        {headings.map(({ id, level, text }) => (
          <li
            key={id}
            style={{ paddingLeft: `${Math.max(0, level - 2) * 12}px` }}
          >
            <a
              className={cn(
                "block leading-snug transition-colors hover:text-foreground",
                activeId === id
                  ? "font-medium text-editorial"
                  : "text-muted-foreground",
              )}
              href={`#${id}`}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
