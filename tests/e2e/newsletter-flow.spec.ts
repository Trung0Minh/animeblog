import { expect, test } from "@playwright/test"

interface NewsletterTokenResponse {
  data?: {
    token: string
  }
  error?: string
}

test.describe("Newsletter flow", () => {
  test("visitor can subscribe to the newsletter", async ({ page }, testInfo) => {
    const email = `newsletter-${testInfo.project.name}-${Date.now()}@example.com`

    await page.goto("/")
    await page.getByRole("textbox", { name: "Email address" }).fill(email)
    await page.getByRole("button", { name: "Subscribe" }).click()

    await expect(page.getByRole("status")).toHaveText(
      "Subscribed successfully.",
    )
  })

  test("unsubscribe page processes a subscriber token", async ({
    page,
  }, testInfo) => {
    const email = `unsubscribe-${testInfo.project.name}-${Date.now()}@example.com`
    const subscribeResponse = await page.request.post(
      "/api/newsletter/subscribe",
      { data: { email } },
    )
    expect(subscribeResponse.ok()).toBe(true)

    const tokenResponse = await page.request.get(
      `/api/test/newsletter-token?email=${encodeURIComponent(email)}`,
    )
    const payload = (await tokenResponse.json()) as NewsletterTokenResponse
    expect(tokenResponse.ok(), payload.error).toBe(true)

    if (!payload.data) {
      throw new Error("Newsletter token response did not include data")
    }

    await page.goto(`/unsubscribe?token=${payload.data.token}`)

    await expect(
      page.getByRole("heading", { name: "You've been unsubscribed" }),
    ).toBeVisible()
  })
})
