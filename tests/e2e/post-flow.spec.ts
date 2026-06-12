import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

test.describe("Writer post flow", () => {
  test("writer can open the editor and create a published post", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const title = `E2E Editor Post ${testInfo.project.name} ${Date.now()}`
    const body = "Phase sixteen editor body content."
    const publishedTitle = `E2E Published Post ${testInfo.project.name} ${Date.now()}`

    await page.goto("/dashboard/new")
    await expect(page.getByTestId("post-editor-shell")).toBeVisible()
    await expect(page.getByTestId("editor-writing-surface")).toBeVisible()
    await expect(page.getByLabel("Category")).toHaveCount(0)
    await page.getByRole("button", { name: "Post settings" }).click()
    await expect(page.getByRole("button", { name: "Hide settings" })).toBeVisible()
    await expect(page.getByLabel("Category")).toBeVisible()

    await page.getByRole("textbox", { name: "Title" }).fill(title)
    await page.locator(".ProseMirror").fill(body)
    await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
      title,
    )
    await expect(page.getByRole("button", { name: "Save draft" })).toBeEnabled()

    const publishedPost = await createPost(page.request, {
      contentText: body,
      title: publishedTitle,
    })

    expect(publishedPost.status).toBe("PUBLISHED")
    expect(publishedPost.slug).toContain("e2e-published-post")
  })

  test("draft post is not visible from the public post URL", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const title = `E2E Private Draft ${testInfo.project.name} ${Date.now()}`
    const post = await createPost(page.request, {
      contentText: "Draft-only content.",
      status: "DRAFT",
      title,
    })

    await page.context().clearCookies()
    const response = await page.goto(`/${post.slug}`)

    expect(response?.status()).toBe(404)
  })

  test("reader can open and navigate the post image lightbox", async ({
    page,
  }, testInfo) => {
    await loginAsWriter(page)

    const post = await createPost(page.request, {
      content: {
        content: [
          {
            attrs: {
              alt: "Opening frame",
              src: "https://cdn.example.com/e2e-frame-a.webp",
            },
            type: "image",
          },
          {
            attrs: {
              images: JSON.stringify([
                {
                  alt: "Motion frame",
                  caption: "Timing comparison",
                  url: "https://cdn.example.com/e2e-frame-b.gif",
                },
              ]),
            },
            type: "imageGallery",
          },
        ],
        type: "doc",
      },
      contentText: "A lightbox verification post.",
      title: `E2E Lightbox Post ${testInfo.project.name} ${Date.now()}`,
    })

    await page.context().clearCookies()
    await page.goto(`/${post.slug}`)
    await page.getByRole("img", { name: "Opening frame" }).click()

    const lightbox = page.getByRole("dialog", { name: "Image viewer" })
    await expect(lightbox).toBeVisible()
    await expect(lightbox.getByText("1 / 2")).toBeVisible()

    await page.keyboard.press("ArrowRight")

    await expect(lightbox.getByRole("img", { name: "Motion frame" })).toBeVisible()
    await expect(lightbox.getByText("Timing comparison")).toBeVisible()

    await lightbox.getByRole("button", { name: "Zoom in" }).click()
    await page.keyboard.press("Escape")

    await expect(lightbox).toBeHidden()
  })
})
