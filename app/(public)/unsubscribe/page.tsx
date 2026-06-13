import Link from "next/link"

import { PageContainer } from "@/components/layout/PageContainer"
import { prisma } from "@/lib/prisma"

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>
}

type UnsubscribeStatus = "already" | "invalid" | "success"

const messages: Record<
  UnsubscribeStatus,
  { body: string; heading: string; tone: string }
> = {
  already: {
    body: "Địa chỉ này hiện không đăng ký nhận email bản tin.",
    heading: "Đã hủy đăng ký",
    tone: "border-muted bg-muted/30",
  },
  invalid: {
    body: "Liên kết hủy đăng ký này không hợp lệ. Nó có thể đã hết hạn hoặc được sao chép không chính xác.",
    heading: "Liên kết không hợp lệ",
    tone: "border-destructive/30 bg-destructive/5",
  },
  success: {
    body: "Bạn sẽ không nhận được thêm bất kỳ email bản tin nào từ blog này.",
    heading: "Bạn đã được hủy đăng ký",
    tone: "border-editorial/30 bg-editorial/5",
  },
}

export default async function UnsubscribePage({
  searchParams,
}: UnsubscribePageProps) {
  const { token } = await searchParams

  if (!token) {
    return <UnsubscribeResult status="invalid" />
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({
    select: { status: true, token: true },
    where: { token },
  })

  if (!subscriber) {
    return <UnsubscribeResult status="invalid" />
  }

  if (subscriber.status === "UNSUBSCRIBED") {
    return <UnsubscribeResult status="already" />
  }

  await prisma.newsletterSubscriber.update({
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
    select: { token: true },
    where: { token },
  })

  return <UnsubscribeResult status="success" />
}

function UnsubscribeResult({ status }: { status: UnsubscribeStatus }) {
  const message = messages[status]

  return (
    <PageContainer className="flex min-h-[70vh] items-center justify-center py-16">
      <section
        className={`w-full max-w-md rounded-[8px] border p-8 text-center ${message.tone}`}
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-editorial">
          Bản tin
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {message.heading}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message.body}
        </p>
        <Link
          className="mt-6 inline-flex rounded-[5px] bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          Quay lại blog
        </Link>
      </section>
    </PageContainer>
  )
}
