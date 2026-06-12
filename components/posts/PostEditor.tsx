"use client"

import { ChevronDown, Settings2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { EditorTopBar } from "@/components/editor/EditorTopBar"
import {
  TiptapEditor,
  type JSONContent,
} from "@/components/editor/TiptapEditor"
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
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
  const canSave = title.trim().length > 0
  const autosaveHint = postId
    ? "Autosave starts after you edit title, excerpt, or body."
    : "Save once to enable autosave for this draft."

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
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
      data-testid="post-editor-shell"
    >
      <EditorTopBar
        autosaveHint={autosaveHint}
        canSave={canSave}
        exitHref="/dashboard"
        isPending={isPending}
        isPublished={initialData?.status === "PUBLISHED"}
        onPublish={() => startTransition(() => void savePost("PUBLISHED"))}
        onSaveDraft={() => startTransition(() => void savePost("DRAFT"))}
        saveStatus={saveStatus}
      />

      <main className="min-h-0 flex-1 overflow-y-auto bg-muted/20">
        <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {error && (
            <div
              className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </div>
          )}

          <section
            className="rounded-2xl border bg-background shadow-sm"
            data-testid="editor-writing-surface"
          >
            <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
              <div className="space-y-3">
                <label className="sr-only" htmlFor="post-title">
                  Title
                </label>
                <input
                  className="w-full border-none bg-transparent text-3xl font-bold leading-[0.98] tracking-tight outline-none placeholder:text-muted-foreground md:text-5xl"
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

              <div className="mt-5 space-y-2">
                <label className="sr-only" htmlFor="post-excerpt">
                  Excerpt
                </label>
                <Textarea
                  className="min-h-14 resize-none border-none bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0 sm:text-lg"
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

              <div className="mt-6 border-t pt-5">
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
            </div>
          </section>
        </div>
      </main>

      <footer className="shrink-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
          <button
            aria-controls="post-settings-panel"
            aria-expanded={isSettingsOpen}
            className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-left transition-colors hover:bg-accent/60"
            onClick={() => setIsSettingsOpen((current) => !current)}
            type="button"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Settings2 aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {isSettingsOpen ? "Hide settings" : "Post settings"}
                </span>
                <span
                  aria-hidden="true"
                  className="block truncate text-xs text-muted-foreground"
                >
                  Cover, category, tags, co-authors, and draft visibility
                </span>
              </span>
            </span>
            <ChevronDown
              aria-hidden="true"
              className={[
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isSettingsOpen ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>

          {isSettingsOpen && (
            <div
              className="max-h-[60vh] overflow-y-auto border-t pt-4"
              id="post-settings-panel"
            >
              <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div>
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

                <div className="grid content-start gap-5">
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
              </div>

              {availableWriters.length > 0 && (
                <fieldset className="mt-5 rounded-xl border p-4">
                  <legend className="px-1 text-sm font-medium">
                    Co-authors
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
