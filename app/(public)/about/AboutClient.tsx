"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Save, X } from "lucide-react"
import type { JSONContent } from "@tiptap/react"

import { TiptapEditor } from "@/components/editor/TiptapEditor"
import { PostBody } from "@/components/posts/PostBody"
import { Button } from "@/components/ui/button"
import { updateAboutPage } from "./actions"

interface AboutClientProps {
  initialPage: { content: any; contentText: string | null } | null
  isAdmin: boolean
  appName: string
}

const defaultContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Ấn phẩm này được xây dựng dành cho các bài tiểu luận, bài phê bình và ghi chú cần không gian để phân tích sâu. Trọng tâm không phải là các cuộc thảo luận hàng ngày hay chấm điểm nhanh chóng. Mà là sự chú ý kỹ lưỡng: một cảnh phim đang thể hiện điều gì, nó được thực hiện như thế nào và tại sao những lựa chọn đó lại quan trọng.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Các tác giả tham gia theo lời mời để trang web có thể duy trì quy mô nhỏ, có chủ đích và được biên tập theo một tiêu chuẩn chung cho các bài phê bình anime dài kỳ.",
        },
      ],
    },
  ],
}

export function AboutClient({ initialPage, isAdmin, appName }: AboutClientProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState<JSONContent>(
    (initialPage?.content as JSONContent) || defaultContent
  )
  const [contentText, setContentText] = useState(initialPage?.contentText || "")

  async function handleSave() {
    setIsSaving(true)
    try {
      await updateAboutPage(content, contentText)
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Lỗi khi lưu. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative group">
      {isAdmin && !isEditing && (
        <Button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-0 opacity-0 transition-opacity group-hover:opacity-100"
          size="sm"
          variant="outline"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-editorial">
              Chỉnh sửa nội dung Giới thiệu
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-border-default p-4 bg-background">
            <TiptapEditor
              content={content}
              editable={true}
              onChange={(json, text) => {
                setContent(json)
                setContentText(text)
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
          <PostBody content={content} />
        </div>
      )}
    </div>
  )
}
