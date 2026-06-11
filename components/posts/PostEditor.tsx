"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  TiptapEditor,
  type JSONContent,
} from "@/components/editor/TiptapEditor"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { TagInput, type TagOption } from "@/components/posts/TagInput"

interface CategoryOption {
  children: { id: string; name: string; slug?: string }[]
  id: string
  name: string
  slug: string
}

interface WriterOption {
  id: string
  name: string
  username: string
}

interface InitialPostData {
  categoryId: string | null
  coAuthorIds: string[]
  content: JSONContent
  coverAlt: string | null
  coverUrl: string | null
  excerpt: string | null
  id: string
  status: "DRAFT" | "PUBLISHED"
  tags: TagOption[]
  title: string
}

interface PostEditorProps {
  categories: CategoryOption[]
  currentUserId: string
  initialData?: InitialPostData
  initialTags?: TagOption[]
  writers: WriterOption[]
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

function getPostResponse(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    typeof value.data === "object" &&
    value.data !== null &&
    "id" in value.data &&
    "slug" in value.data &&
    typeof value.data.id === "string" &&
    typeof value.data.slug === "string"
  ) {
    return value.data
  }

  return null
}

const emptyDoc: JSONContent = {
  content: [{ type: "paragraph" }],
  type: "doc",
}

export function PostEditor({
  categories,
  currentUserId,
  initialData,
  initialTags = [],
  writers,
}: PostEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "")
  const [coAuthorIds, setCoAuthorIds] = useState<string[]>(
    initialData?.coAuthorIds ?? [],
  )
  const [content, setContent] = useState<JSONContent>(
    initialData?.content ?? emptyDoc,
  )
  const [contentText, setContentText] = useState("")
  const [coverAlt, setCoverAlt] = useState(initialData?.coverAlt ?? "")
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl ?? "")
  const [error, setError] = useState("")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    initialData?.tags ?? initialTags,
  )
  const [title, setTitle] = useState(initialData?.title ?? "")

  const isEditing = Boolean(initialData)

  async function savePost(status: "DRAFT" | "PUBLISHED") {
    setError("")

    const payload = {
      categoryId: categoryId || undefined,
      coAuthorIds,
      content,
      contentText,
      coverAlt: coverAlt || undefined,
      coverUrl: coverUrl || undefined,
      excerpt,
      status,
      tagIds: selectedTags.map((tag) => tag.id),
      title,
    }

    try {
      const response = await fetch(
        isEditing ? `/api/posts/${initialData?.id}` : "/api/posts",
        {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: isEditing ? "PATCH" : "POST",
        },
      )
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      const post = getPostResponse(result)

      if (!post) {
        throw new Error("Post response did not include a slug")
      }

      if (status === "PUBLISHED") {
        router.push(`/${post.slug}`)
        return
      }

      if (!isEditing) {
        router.push(`/dashboard/edit/${post.id}`)
      } else {
        router.refresh()
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Something went wrong",
      )
    }
  }

  function toggleCoAuthor(writerId: string) {
    setCoAuthorIds((currentIds) =>
      currentIds.includes(writerId)
        ? currentIds.filter((id) => id !== writerId)
        : [...currentIds, writerId],
    )
  }

  const availableWriters = writers.filter((writer) => writer.id !== currentUserId)

  return (
    <div className="container max-w-4xl py-8">
      {error && (
        <div
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label className="sr-only" htmlFor="post-title">
          Title
        </label>
        <input
          className="w-full border-none bg-transparent text-xl font-bold leading-tight tracking-tight outline-none placeholder:text-muted-foreground md:text-3xl"
          id="post-title"
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title..."
          value={title}
        />
      </div>

      <div className="mt-4 space-y-2">
        <label className="sr-only" htmlFor="post-excerpt">
          Excerpt
        </label>
        <Textarea
          className="min-h-20 resize-none border-none bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
          id="post-excerpt"
          maxLength={500}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="Short excerpt shown on listing pages..."
          value={excerpt}
        />
      </div>

      <div className="mt-6">
        <CoverImageUpload onChange={setCoverUrl} value={coverUrl} />
        {coverUrl && (
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium" htmlFor="cover-alt">
              Cover alt text
            </label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              id="cover-alt"
              maxLength={200}
              onChange={(event) => setCoverAlt(event.target.value)}
              placeholder="Describe the cover image"
              value={coverAlt}
            />
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="post-category">
            Category
          </label>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
            id="post-category"
            onChange={(event) => setCategoryId(event.target.value)}
            value={categoryId}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <optgroup key={category.id} label={category.name}>
                <option value={category.id}>{category.name}</option>
                {category.children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <TagInput onChange={setSelectedTags} selectedTags={selectedTags} />
      </div>

      {availableWriters.length > 0 && (
        <fieldset className="mt-6 rounded-xl border p-4">
          <legend className="px-1 text-sm font-medium">Co-authors</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {availableWriters.map((writer) => (
              <label
                className="flex items-center gap-2 text-sm"
                key={writer.id}
              >
                <input
                  checked={coAuthorIds.includes(writer.id)}
                  className="h-4 w-4 rounded border"
                  onChange={() => toggleCoAuthor(writer.id)}
                  type="checkbox"
                />
                {writer.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-6 border-t pt-6">
        <TiptapEditor
          content={content}
          editable
          onChange={(json, text) => {
            setContent(json)
            setContentText(text)
          }}
        />
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-col gap-3 border-t bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {isPending ? "Saving..." : "Changes are saved manually."}
        </p>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button
            className="flex-1 sm:flex-none"
            disabled={isPending || !title.trim()}
            onClick={() => startTransition(() => void savePost("DRAFT"))}
            type="button"
            variant="outline"
          >
            Save draft
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            disabled={isPending || !title.trim()}
            onClick={() => startTransition(() => void savePost("PUBLISHED"))}
            type="button"
          >
            {initialData?.status === "PUBLISHED" ? "Update" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  )
}
