import { expect, test } from "@playwright/test"

test("shows the editorial publication foundation", async ({ page }) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Serious writing about Japanese animation.",
    }),
  ).toBeVisible()
  await expect(page.getByRole("banner").getByRole("link").first()).toHaveAttribute(
    "href",
    "/",
  )
  await expect(page.locator("html")).toHaveAttribute("lang", "vi")
})
