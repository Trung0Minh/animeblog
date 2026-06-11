import { expect, test } from "@playwright/test"

import { loginAsWriter } from "./helpers/auth"
import { createPost } from "./helpers/posts"

async function createPublishedPostForComments(
  page: Parameters<typeof loginAsWriter>[0],
  title: string,
) {
  await loginAsWriter(page)
  const post = await createPost(page.request, {
    contentText: "A published post for comment flow testing.",
    title,
  })
  await page.context().clearCookies()
  return post
}

test.describe("Comment flow", () => {
  test("visitor can post a comment", async ({ page }, testInfo) => {
    const post = await createPublishedPostForComments(
      page,
      `E2E Comment Post ${testInfo.project.name} ${Date.now()}`,
    )
    const comment = `This is my E2E comment ${Date.now()}.`

    await page.goto(`/${post.slug}#comments`)
    await page.getByRole("textbox", { name: "Name" }).fill("Test Visitor")
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("visitor@example.com")
    await page.getByRole("textbox", { name: "Comment" }).fill(comment)
    const commentResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/comments") &&
        response.request().method() === "POST",
    )
    await page.getByRole("button", { name: "Post comment" }).click()
    expect((await commentResponse).ok()).toBe(true)

    await expect(page.getByText("Test Visitor")).toBeVisible()
    await expect(page.getByText(comment)).toBeVisible()
  })

  test("visitor can reply to a top-level comment", async ({
    page,
  }, testInfo) => {
    const post = await createPublishedPostForComments(
      page,
      `E2E Reply Post ${testInfo.project.name} ${Date.now()}`,
    )
    const original = `Original E2E comment ${Date.now()}.`
    const reply = `Nested E2E reply ${Date.now()}.`

    await page.goto(`/${post.slug}#comments`)
    await page
      .getByRole("textbox", { name: "Name" })
      .fill("Original Commenter")
    await page
      .getByRole("textbox", { name: "Email" })
      .fill("original@example.com")
    await page.getByRole("textbox", { name: "Comment" }).fill(original)
    await page.getByRole("button", { name: "Post comment" }).click()
    await expect(page.getByText(original)).toBeVisible()

    const thread = page.locator("article").filter({ hasText: original }).first()
    await thread.getByRole("button", { name: /Reply to Original/ }).click()

    const replyForm = page.getByRole("form", {
      name: "Reply to Original Commenter",
    })
    await replyForm.getByRole("textbox", { name: "Name" }).fill("Replier")
    await replyForm
      .getByRole("textbox", { name: "Email" })
      .fill("reply@example.com")
    await replyForm.getByRole("textbox", { name: "Comment" }).fill(reply)
    await replyForm.getByRole("button", { name: "Post reply" }).click()

    await expect(page.getByText(reply)).toBeVisible()
  })
})
