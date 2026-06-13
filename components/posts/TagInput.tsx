"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Plus, X } from "lucide-react"

import { useDebounce } from "@/hooks/useDebounce"

export interface TagOption {
  id: string
  name: string
  slug: string
}

interface TagInputProps {
  onChange: (tags: TagOption[]) => void
  selectedTags: TagOption[]
}

function isTagArray(value: unknown): value is TagOption[] {
  return Array.isArray(value) && value.every((tag) => getTag(tag) !== null)
}

function getTag(value: unknown): TagOption | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const record = value as Record<string, unknown>

  if (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.slug === "string"
  ) {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
    }
  }

  return null
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

  return "Tag request failed"
}

export function TagInput({ onChange, selectedTags }: TagInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<TagOption[]>([])
  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    const trimmedQuery = debouncedQuery.trim()

    if (!trimmedQuery) {
      return
    }

    let cancelled = false

    fetch(`/api/tags?q=${encodeURIComponent(trimmedQuery)}`)
      .then((response) => response.json() as Promise<unknown>)
      .then((result) => {
        if (cancelled) {
          return
        }

        const tags =
          typeof result === "object" && result !== null && "data" in result
            ? result.data
            : []

        if (isTagArray(tags)) {
          setSuggestions(
            tags.filter(
              (tag) => !selectedTags.some((selected) => selected.id === tag.id),
            ),
          )
        } else {
          setSuggestions([])
        }

        setOpen(true)
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([])
          setOpen(false)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, selectedTags])

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [])

  function addTag(tag: TagOption) {
    if (!selectedTags.some((selectedTag) => selectedTag.id === tag.id)) {
      onChange([...selectedTags, tag])
    }

    setError("")
    setOpen(false)
    setQuery("")
    setSuggestions([])
  }

  async function createTag() {
    const name = query.trim()

    if (!name) {
      return
    }

    setCreating(true)
    setError("")

    try {
      const response = await fetch("/api/tags", {
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const tag =
        typeof result === "object" && result !== null && "data" in result
          ? getTag(result.data)
          : null

      if (!tag) {
        throw new Error("Tag response did not include a tag")
      }

      addTag(tag)
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create tag",
      )
    } finally {
      setCreating(false)
    }
  }

  const exactMatch = suggestions.some(
    (tag) => tag.name.toLowerCase() === query.trim().toLowerCase(),
  )

  return (
    <div className="relative" ref={containerRef}>
      <label className="mb-2 block text-xs font-semibold text-text-secondary" htmlFor="post-tags">
        Thẻ
      </label>

      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-subtle-bg px-3 py-1.5 text-[13px] text-text-secondary"
              key={tag.id}
            >
              {tag.name}
              <button
                aria-label={`Xóa thẻ ${tag.name}`}
                className="-m-1.5 inline-flex items-center justify-center rounded-full p-1.5 text-text-tertiary transition-colors hover:bg-background hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  onChange(
                    selectedTags.filter(
                      (selectedTag) => selectedTag.id !== tag.id,
                    ),
                  )
                }
                type="button"
              >
                <X aria-hidden="true" className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          aria-label="Thẻ"
          autoComplete="off"
          className="h-[34px] w-full rounded-[5px] border border-border-default bg-background px-2.5 py-2 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
          id="post-tags"
          onChange={(event) => {
            const nextQuery = event.target.value
            setQuery(nextQuery)

            if (!nextQuery.trim()) {
              setSuggestions([])
              setOpen(false)
              setLoading(false)
            } else {
              setLoading(true)
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0 || query.trim()) {
              setOpen(true)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false)
            }

            if (event.key === "Enter") {
              event.preventDefault()

              if (suggestions.length === 1) {
                addTag(suggestions[0])
              } else if (!exactMatch && query.trim()) {
                void createTag()
              }
            }
          }}
          placeholder="Tìm kiếm hoặc tạo thẻ..."
          value={query}
        />
        {loading && (
          <Loader2
            aria-hidden="true"
            className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-text-tertiary"
          />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-[5px] border border-border-default bg-background shadow-md">
          {suggestions.map((tag) => (
            <button
              className="block w-full px-3 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-subtle-bg"
              key={tag.id}
              onClick={() => addTag(tag)}
              type="button"
            >
              {tag.name}
            </button>
          ))}

          {!exactMatch && (
            <button
              className="flex w-full items-center gap-1.5 border-t border-border-default px-3 py-2 text-left text-[13px] text-accent transition-colors hover:bg-subtle-bg disabled:opacity-50"
              disabled={creating}
              onClick={() => void createTag()}
              type="button"
            >
              {creating ? (
                <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              Tạo thẻ &quot;{query.trim()}&quot;
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-text-tertiary">
        Tìm kiếm thẻ có sẵn hoặc tạo thẻ mới.
      </p>
    </div>
  )
}
