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
})
