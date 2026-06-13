"use client"

import { FormEvent, useState } from "react"

import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ProfileFormProps {
  user: {
    avatarUrl: string | null
    bio: string | null
    email: string
    name: string
    username: string
  }
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

export function ProfileForm({ user }: ProfileFormProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "")
  const [bio, setBio] = useState(user.bio ?? "")
  const [message, setMessage] = useState<{
    text: string
    type: "error" | "success"
  } | null>(null)
  const [name, setName] = useState(user.name)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setSaving(true)

    try {
      const response = await fetch("/api/profile", {
        body: JSON.stringify({
          avatarUrl: avatarUrl || null,
          bio,
          name,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
      const result: unknown = await response.json()

      if (!response.ok) {
        throw new Error(getApiError(result))
      }

      setMessage({ text: "Profile updated successfully.", type: "success" })
    } catch (saveError) {
      setMessage({
        text: saveError instanceof Error ? saveError.message : "Save failed",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {message && (
        <div
          className={
            message.type === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          }
          role="status"
        >
          {message.text}
        </div>
      )}

      <section className="rounded-[8px] border p-4 sm:p-5">
        <label className="mb-3 block text-sm font-medium">Avatar</label>
        <AvatarUpload name={name} onChange={setAvatarUrl} value={avatarUrl} />
      </section>

      <div className="grid gap-5">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-name">
            Display name
          </label>
          <Input
            autoComplete="name"
            id="profile-name"
            maxLength={50}
            minLength={2}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="profile-bio">
              Bio
            </label>
            <span className="text-xs text-muted-foreground">
              {bio.length}/500
            </span>
          </div>
          <Textarea
            id="profile-bio"
            maxLength={500}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Tell readers what you write about."
            rows={5}
            value={bio}
          />
        </div>
      </div>

      <div className="grid gap-5 border-t pt-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-username">
            Username
          </label>
          <Input
            disabled
            id="profile-username"
            readOnly
            value={`@${user.username}`}
          />
          <p className="text-xs text-muted-foreground">
            This is part of your public profile URL.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="profile-email">
            Email
          </label>
          <Input disabled id="profile-email" readOnly value={user.email} />
          <p className="text-xs text-muted-foreground">
            Email is tied to your login account.
          </p>
        </div>
      </div>

      <Button className="w-full sm:w-auto" disabled={saving || !name.trim()}>
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
