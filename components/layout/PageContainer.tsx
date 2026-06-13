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
  narrow: "max-w-[720px]",
  wide: "max-w-[1440px]",
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
      className={cn(
        "mx-auto w-full px-4 py-8 md:px-6 md:py-12 lg:px-8",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </Component>
  )
}
