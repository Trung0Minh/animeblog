import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AvatarUpload } from "@/components/profile/AvatarUpload"
import { ProfileForm } from "@/components/profile/ProfileForm"

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              avatarUrl: null,
              bio: "Production notes and layout analysis.",
              email: "mina@example.com",
              id: "writer-1",
              name: "Mina Revised",
              username: "mina",
            },
          }),
          { status: 200 },
        ),
      ),
    )
  })

  it("submits editable fields and keeps username/email read-only", async () => {
    const user = userEvent.setup()

    render(
      <ProfileForm
        user={{
          avatarUrl: null,
          bio: "Initial bio",
          email: "mina@example.com",
          name: "Mina",
          username: "mina",
        }}
      />,
    )

    expect(screen.getByRole("textbox", { name: "Username" })).toBeDisabled()
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled()

    await user.clear(screen.getByRole("textbox", { name: "Display name" }))
    await user.type(
      screen.getByRole("textbox", { name: "Display name" }),
      "Mina Revised",
    )
    await user.clear(screen.getByRole("textbox", { name: "Bio" }))
    await user.type(
      screen.getByRole("textbox", { name: "Bio" }),
      "Production notes and layout analysis.",
    )
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/profile", {
        body: JSON.stringify({
          avatarUrl: null,
          bio: "Production notes and layout analysis.",
          name: "Mina Revised",
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      })
    })
    expect(
      await screen.findByText("Profile updated successfully."),
    ).toBeInTheDocument()
  })
})

describe("AvatarUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { url: "https://cdn.example.com/avatars/avatar.png" },
          }),
          { status: 201 },
        ),
      ),
    )
  })

  it("uploads avatar files to the avatars folder", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<AvatarUpload name="Mina Writer" onChange={onChange} value="" />)

    await user.upload(
      screen.getByLabelText("Upload avatar"),
      new File(["png"], "avatar.png", { type: "image/png" }),
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        "https://cdn.example.com/avatars/avatar.png",
      )
    })
    const request = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as {
      body: FormData
      method: string
    }
    expect(request.method).toBe("POST")
    expect(request.body.get("folder")).toBe("avatars")
  })

  it("stacks avatar controls on mobile and aligns them on wider screens", () => {
    const { container } = render(
      <AvatarUpload name="Mina Writer" onChange={vi.fn()} value="" />,
    )

    expect(container.firstElementChild).toHaveClass(
      "flex-col",
      "sm:flex-row",
    )
  })
})
