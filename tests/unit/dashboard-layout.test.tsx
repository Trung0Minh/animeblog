import { render, screen } from "@testing-library/react"
import type { AnchorHTMLAttributes } from "react"
import { describe, expect, it, vi } from "vitest"

vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      username: "mina",
    },
  })),
}))

import DashboardLayout from "@/app/(writer)/dashboard/layout"

describe("DashboardLayout", () => {
  it("keeps dashboard navigation horizontally scrollable on small screens", async () => {
    render(await DashboardLayout({ children: <p>Dashboard body</p> }))

    expect(
      screen.getByRole("navigation", { name: "Dashboard navigation" }),
    ).toHaveClass("overflow-x-auto", "whitespace-nowrap")
  })
})
