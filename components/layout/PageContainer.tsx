import { cn } from "@/lib/utils"

type PageContainerElement = "article" | "div" | "main"
type PageContainerSize = "default" | "narrow" | "wide"

interface PageContainerProps {
  as?: PageContainerElement
  children: React.ReactNode
  className?: string
  size?: PageContainerSize
}

const sizeClasses: Record<PageContainerSize, string> = {
  default: "max-w-5xl xl:max-w-6xl",
  narrow: "max-w-3xl xl:max-w-4xl",
  wide: "max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px]",
}

export function PageContainer({
  as = "main",
  children,
  className,
  size = "default",
}: PageContainerProps) {
  const Component = as

  return (
    <Component
      className={cn("container py-8 sm:py-10", sizeClasses[size], className)}
    >
      {children}
    </Component>
  )
}
