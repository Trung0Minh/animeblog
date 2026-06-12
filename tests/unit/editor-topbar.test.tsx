import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
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

import { EditorTopBar } from "@/components/editor/EditorTopBar"

describe("EditorTopBar", () => {
  it("shows exit, save status, and save/publish actions", async () => {
    const user = userEvent.setup()
    const onPublish = vi.fn()
    const onSaveDraft = vi.fn()

    render(
      <EditorTopBar
        canSave
        exitHref="/dashboard"
        isPending={false}
        isPublished={false}
        onPublish={onPublish}
        onSaveDraft={onSaveDraft}
        saveStatus="saved"
      />,
    )

    expect(screen.getByRole("link", { name: "Exit" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByText("Saved")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Save draft" }))
    await user.click(screen.getByRole("button", { name: "Publish" }))

    expect(onSaveDraft).toHaveBeenCalledTimes(1)
    expect(onPublish).toHaveBeenCalledTimes(1)
  })

  it("uses update copy for published posts and disables actions without a title", () => {
    render(
      <EditorTopBar
        canSave={false}
        exitHref="/dashboard"
        isPending={false}
        isPublished
        onPublish={vi.fn()}
        onSaveDraft={vi.fn()}
        saveStatus="idle"
      />,
    )

    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled()
    expect(
      screen.getByText("Add a title to enable saving and publishing."),
    ).toBeVisible()
  })
})
