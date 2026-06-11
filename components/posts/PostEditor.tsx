"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import {
  TiptapEditor,
  type JSONContent,
} from "@/components/editor/TiptapEditor"
import { SaveStatusIndicator } from "@/components/editor/SaveStatusIndicator"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { DraftVisibilityToggle } from "@/components/posts/DraftVisibilityToggle"
import { TagInput, type TagOption } from "@/components/posts/TagInput"
import { useAutosave } from "@/hooks/useAutosave"
import { useWarnUnsaved } from "@/hooks/useWarnUnsaved"

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
  contentText: string | null
  coverAlt: string | null
  coverUrl: string | null
  draftVisibility: "PRIVATE" | "CO_AUTHORS"
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

interface PostMutationResponse {
  id: string
  slug: string
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

function getPostResponse(value: unknown): PostMutationResponse | null {
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
    return { id: value.data.id, slug: value.data.slug }
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
  const [contentText, setContentText] = useState(initialData?.contentText ?? "")
  const [coverAlt, setCoverAlt] = useState(initialData?.coverAlt ?? "")
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl ?? "")
  const [draftVisibility, setDraftVisibility] = useState<
    "PRIVATE" | "CO_AUTHORS"
  >(initialData?.draftVisibility ?? "PRIVATE")
  const [error, setError] = useState("")
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "")
  const [isDirty, setIsDirty] = useState(false)
  const [postId, setPostId] = useState<string | null>(initialData?.id ?? null)
  const [selectedTags, setSelectedTags] = useState<TagOption[]>(
    initialData?.tags ?? initialTags,
  )
  const [title, setTitle] = useState(initialData?.title ?? "")
  const autosaveDraftRef = useRef({
    content,
    contentText,
    excerpt,
    title,
  })

  const hasCoAuthors = coAuthorIds.length > 0
  const effectiveDraftVisibility = hasCoAuthors ? draftVisibility : "PRIVATE"
  const isEditing = Boolean(postId)

  useEffect(() => {
    autosaveDraftRef.current = {
      content,
      contentText,
      excerpt,
      title,
    }
  }, [content, contentText, excerpt, title])

  const performAutosave = useCallback(async () => {
    if (!postId) return

    const draft = autosaveDraftRef.current
    const response = await fetch(`/api/posts/${postId}`, {
      body: JSON.stringify({
        content: draft.content,
        contentText: draft.contentText,
        excerpt: draft.excerpt,
        title: draft.title,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    })
    const result: unknown = await response.json()

    if (!response.ok) {
      throw new Error(getApiError(result))
    }

    setIsDirty(false)
  }, [postId])

  const {
    scheduleDebounce,
    status: saveStatus,
  } = useAutosave({
    onSave: performAutosave,
    postId,
  })

  useWarnUnsaved(isDirty)

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  const markDirtyAndAutosave = useCallback(() => {
    setIsDirty(true)
    scheduleDebounce()
  }, [scheduleDebounce])

  async function savePost(status: "DRAFT" | "PUBLISHED") {
    setError("")

    const payload = {
      categoryId: categoryId || undefined,
      coAuthorIds,
      content,
      contentText,
      coverAlt: coverAlt || undefined,
      coverUrl: coverUrl || undefined,
      draftVisibility: effectiveDraftVisibility,
      excerpt,
      status,
      tagIds: selectedTags.map((tag) => tag.id),
      title,
    }

    try {
      const response = await fetch(
        postId ? `/api/posts/${postId}` : "/api/posts",
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
        setIsDirty(false)
        router.push(`/${post.slug}`)
        return
      }

      setPostId(post.id)
      setIsDirty(false)

      if (!postId) {
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
    markDirty()
    setCoAuthorIds((currentIds) => {
      const nextIds = currentIds.includes(writerId)
        ? currentIds.filter((id) => id !== writerId)
        : [...currentIds, writerId]

      if (nextIds.length === 0) {
        setDraftVisibility("PRIVATE")
      }

      return nextIds
    })
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
          onChange={(event) => {
            setTitle(event.target.value)
            markDirtyAndAutosave()
          }}
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
          onChange={(event) => {
            setExcerpt(event.target.value)
            markDirtyAndAutosave()
          }}
          placeholder="Short excerpt shown on listing pages..."
          value={excerpt}
        />
      </div>

      <div className="mt-6">
        <CoverImageUpload
          onChange={(url) => {
            setCoverUrl(url)
            markDirty()
          }}
          value={coverUrl}
        />
        {coverUrl && (
          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium" htmlFor="cover-alt">
              Cover alt text
            </label>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
              id="cover-alt"
              maxLength={200}
              onChange={(event) => {
                setCoverAlt(event.target.value)
                markDirty()
              }}
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
            onChange={(event) => {
              setCategoryId(event.target.value)
              markDirty()
            }}
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

        <TagInput
          onChange={(tags) => {
            setSelectedTags(tags)
            markDirty()
          }}
          selectedTags={selectedTags}
        />
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

      <DraftVisibilityToggle
        hasCoAuthors={hasCoAuthors}
        onChange={(value) => {
          setDraftVisibility(value)
          markDirty()
        }}
        value={draftVisibility}
      />

      <div className="mt-6 border-t pt-6">
        <TiptapEditor
          content={content}
          editable
          onChange={(json, text) => {
            setContent(json)
            setContentText(text)
            markDirtyAndAutosave()
          }}
        />
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-col gap-3 border-t bg-background/95 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-muted-foreground">
          {isPending ? (
            "Saving..."
          ) : (
            <SaveStatusIndicator status={saveStatus} />
          )}
          {!isPending && saveStatus === "idle" && (
            <span>
              {postId
                ? "Autosave starts after you edit title, excerpt, or body."
                : "Save once to enable autosave for this draft."}
            </span>
          )}
        </div>
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
