import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { AnchorHTMLAttributes } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

afterEach(() => {
  vi.useRealTimers()
})

import { Footer } from "@/components/layout/Footer"
import { MobileNav } from "@/components/layout/MobileNav"
import { Navbar } from "@/components/layout/Navbar"
import { PageContainer } from "@/components/layout/PageContainer"
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

  it("loads the writer session after a short delay without requiring a readable cookie", async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, "cookie", {
      configurable: true,
      value: "",
      writable: true,
    })
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

      expect(fetchMock).not.toHaveBeenCalled()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(
        screen.getByRole("button", { name: "Open writer menu" }),
      ).toBeInTheDocument()
      expect(fetchMock).toHaveBeenCalledTimes(1)
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("does not render a writer menu when the deferred session is anonymous", async () => {
    vi.useFakeTimers()
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ user: null })))

    try {
      render(<Navbar />)

      expect(fetchMock).not.toHaveBeenCalled()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300)
      })

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(
        screen.queryByRole("button", { name: "Open writer menu" }),
      ).not.toBeInTheDocument()
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("aligns navigation content with page containers", () => {
    const { container } = render(<Navbar user={null} />)

    expect(container.querySelector("header > div")).toHaveClass("container")
  })
})

describe("PageContainer", () => {
  it("applies the shared public page width and vertical rhythm", () => {
    const { container } = render(<PageContainer>Content</PageContainer>)

    expect(container.firstElementChild).toHaveClass(
      "container",
      "max-w-5xl",
      "xl:max-w-6xl",
      "py-8",
      "sm:py-10",
    )
  })

  it("supports narrow article and wide listing layouts", () => {
    const { container, rerender } = render(
      <PageContainer as="article" size="narrow">
        Article
      </PageContainer>,
    )

    expect(container.firstElementChild?.tagName).toBe("ARTICLE")
    expect(container.firstElementChild).toHaveClass(
      "max-w-3xl",
      "xl:max-w-4xl",
    )

    rerender(<PageContainer size="wide">Listing</PageContainer>)

    expect(container.firstElementChild).toHaveClass(
      "max-w-6xl",
      "xl:max-w-7xl",
      "2xl:max-w-[1400px]",
    )
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

  it("shows an admin panel link for admin users", async () => {
    const user = userEvent.setup()

    render(
      <WriterMenu
        user={{
          avatarUrl: null,
          name: "Mina Admin",
          role: "ADMIN",
          username: "mina",
        }}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Open writer menu" }))

    expect(screen.getByRole("menuitem", { name: "Admin panel" })).toHaveAttribute(
      "href",
      "/admin",
    )
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

  it("shows admin links in the mobile drawer for signed-in admins", async () => {
    const user = userEvent.setup()
    render(
      <MobileNav
        links={[
          { href: "/contributors", label: "Contributors" },
          { href: "/about", label: "About" },
        ]}
        user={{
          avatarUrl: null,
          name: "Mina Admin",
          role: "ADMIN",
          username: "mina",
        }}
      />,
    )

    await user.click(
      screen.getByRole("button", { name: "Open navigation menu" }),
    )

    expect(screen.getByRole("link", { name: "Admin panel" })).toHaveAttribute(
      "href",
      "/admin",
    )
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

  it("uses zoom-friendly responsive sidebar widths", () => {
    const { container } = render(
      <Sidebar categories={[]} recentPosts={[]} />,
    )

    expect(container.firstElementChild).toHaveClass(
      "lg:w-64",
      "xl:w-80",
      "2xl:w-96",
    )
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
