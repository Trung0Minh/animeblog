import type { Metadata } from "next"
import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildMetadata, getAppName } from "@/lib/seo"
import { AboutClient } from "./AboutClient"

const PUBLISHING_NOTES = [
  {
    title: "Phân tích chuyên sâu",
    text: "Những bài luận xem xét hoạt hình, đạo diễn, chỉnh sửa và diễn xuất như những lựa chọn đáng nghiên cứu từng khung hình.",
  },
  {
    title: "Đánh giá có bối cảnh",
    text: "Những bài viết về series và tập phim quan tâm đến kỹ thuật, lịch sử sản xuất và những kỳ vọng mà tác phẩm đang đáp ứng.",
  },
  {
    title: "Ghi chú sản xuất",
    text: "Những bài viết ngắn hơn về các studio, nhân viên, mô-típ hình ảnh và những quyết định thực tế đằng sau những cảnh anime đáng nhớ.",
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const appName = getAppName()

  return buildMetadata({
    canonicalPath: "/about",
    description: `${appName} is an invite-only editorial blog for anime analysis, reviews, and production insight.`,
    title: "Giới thiệu",
  })
}

export default async function AboutPage() {
  const appName = getAppName()
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const page = await prisma.sitePage.findUnique({
    where: { slug: "about" },
  })

  return (
    <PageContainer>
      <section className="border-b pb-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Giới thiệu
        </p>
        <h1 className="max-w-3xl text-balance text-[32px] font-bold leading-tight tracking-tight md:text-[40px]">
          {appName} là một nơi yên tĩnh dành cho những bài viết nghiêm túc về hoạt hình Nhật Bản.
        </h1>
        <AboutClient initialPage={page} isAdmin={isAdmin} appName={appName} />
      </section>

      <section className="py-10">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.12em] text-editorial">
          Những gì chúng tôi xuất bản
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {PUBLISHING_NOTES.map((note) => (
            <article className="border-t py-5 sm:border-t-0 sm:border-l sm:pl-5 sm:first:border-l-0 sm:first:pl-0" key={note.title}>
              <h2 className="font-semibold tracking-tight">{note.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {note.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t py-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Đọc toàn bộ kho lưu trữ.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Bắt đầu với những bài luận mới nhất, hoặc gặp gỡ các tác giả đang định hình ấn phẩm này.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-10 items-center justify-center rounded-[5px] bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            href="/"
          >
            Bài viết mới nhất
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-[5px] border px-4 text-[13px] font-medium transition-colors hover:bg-muted"
            href="/contributors"
          >
            Người đóng góp
          </Link>
        </div>
      </section>
    </PageContainer>
  )
}
