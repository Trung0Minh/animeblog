import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const themeMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  setTheme: vi.fn(),
  theme: "light",
}))

vi.mock("next-auth/react", () => ({
  signOut: themeMocks.signOut,
}))
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({
    setTheme: themeMocks.setTheme,
    theme: themeMocks.theme,
  }),
}))
vi.mock("next/link", () => ({
  default: ({
    prefetch,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => (
    <a data-prefetch={String(prefetch)} {...props} />
  ),
}))
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

import { Footer } from "@/components/layout/Footer"
import { MobileNav } from "@/components/layout/MobileNav"
import { Navbar } from "@/components/layout/Navbar"
import { Sidebar } from "@/components/layout/Sidebar"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { WriterMenu } from "@/components/layout/WriterMenu"

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    themeMocks.theme = "light"
  })

  it("switches from light to dark mode", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    await user.click(
      await screen.findByRole("button", { name: "Switch to dark mode" }),
    )

    expect(themeMocks.setTheme).toHaveBeenCalledWith("dark")
  })
})

describe("Navbar", () => {
  it("renders publication navigation and search access", () => {
    render(<Navbar user={null} />)

    const contributors = screen.getByRole("link", { name: "Contributors" })
    expect(contributors).toHaveAttribute("href", "/contributors")
    expect(contributors).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    )
    expect(
      screen.getByRole("searchbox", { name: "Search posts" }),
    ).toBeInTheDocument()
  })

  it("keeps the desktop writer menu hidden on mobile", () => {
    render(
      <Navbar
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    expect(screen.getByTestId("desktop-writer-menu")).toHaveClass(
      "hidden",
      "md:block",
    )
  })

  it("loads the writer session once for navbar controls", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            user: {
              avatarUrl: null,
              name: "Mina Writer",
              username: "mina",
            },
          }),
        ),
      )

    try {
      render(<Navbar />)

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Open writer menu" }),
        ).toBeInTheDocument()
      })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      fetchMock.mockRestore()
    }
  })
})

describe("WriterMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("opens writer links and signs out", async () => {
    const user = userEvent.setup()

    render(
      <WriterMenu
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Open writer menu" }))

    expect(screen.getByRole("menuitem", { name: "My posts" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(
      screen.getByRole("menuitem", { name: "Edit profile" }),
    ).toHaveAttribute("href", "/dashboard/profile")
    expect(
      screen.getByRole("menuitem", { name: "View public profile" }),
    ).toHaveAttribute("href", "/authors/mina")

    await user.click(screen.getByRole("menuitem", { name: "Sign out" }))

    expect(themeMocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })
})

describe("MobileNav", () => {
  it("opens a drawer containing navigation and search links", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(
      screen.getByText("Browse publication pages and search posts."),
    ).toBeInTheDocument()
    const search = screen.getByRole("link", { name: "Search posts" })
    expect(search).toHaveAttribute("href", "/search")
    expect(search).toHaveAttribute("data-prefetch", "false")
    expect(screen.getByRole("button", { name: "Close" })).toHaveClass(
      "h-11",
      "w-11",
    )
  })

  it("shows writer links in the mobile drawer for signed-in writers", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
        user={{ avatarUrl: null, name: "Mina Writer", username: "mina" }}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    )

    expect(screen.getByRole("link", { name: "My posts" })).toHaveAttribute(
      "href",
      "/dashboard",
    )
    expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    )

    await user.click(screen.getByRole("button", { name: "Sign out" }))

    expect(themeMocks.signOut).toHaveBeenCalledWith({ callbackUrl: "/" })
  })
})

describe("Sidebar", () => {
  it("renders newsletter content, categories, and recent posts", () => {
    render(
      <Sidebar
        categories={[
          {
            _count: { posts: 2 },
            children: [
              { id: "child-1", name: "Animation", slug: "animation" },
            ],
            id: "category-1",
            name: "Production",
            slug: "production",
          },
        ]}
        newsletter={<form aria-label="Newsletter signup" />}
        recentPosts={[
          {
            publishedAt: new Date("2024-04-01T00:00:00Z"),
            slug: "frieren",
            title: "Frieren and the passage of time",
          },
        ]}
      />,
    )

    expect(screen.getByRole("form", { name: "Newsletter signup" })).toBeVisible()
    expect(screen.getByRole("link", { name: /Production/ })).toHaveAttribute(
      "href",
      "/category/production",
    )
    expect(
      screen.getByRole("link", { name: "Frieren and the passage of time" }),
    ).toHaveAttribute("href", "/frieren")
  })
})

describe("Footer", () => {
  it("renders publication links", () => {
    render(<Footer />)

    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    )
    expect(screen.getByRole("link", { name: "Contributors" })).toHaveAttribute(
      "href",
      "/contributors",
    )
  })
})
