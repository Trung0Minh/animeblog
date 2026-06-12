import { expect, test } from "@playwright/test"

const publicPages = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "contributors", path: "/contributors" },
  { name: "search", path: "/search" },
  { name: "unsubscribe", path: "/unsubscribe" },
]

const layoutWidths = [
  { height: 812, label: "mobile", width: 390 },
  { height: 1024, label: "tablet", width: 768 },
  { height: 900, label: "125% zoom on 1440px", width: 1152 },
  { height: 900, label: "100% zoom on 1440px", width: 1440 },
  { height: 900, label: "80% zoom on 1440px", width: 1800 },
  { height: 1080, label: "1920px desktop", width: 1920 },
]

test.describe("public layout width and zoom behavior", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "The layout matrix controls viewport sizes directly.",
    )
  })

  for (const publicPage of publicPages) {
    for (const viewport of layoutWidths) {
      test(`${publicPage.name} has no horizontal overflow at ${viewport.label}`, async ({
        page,
      }) => {
        await page.setViewportSize({
          height: viewport.height,
          width: viewport.width,
        })
        await page.goto(publicPage.path, { waitUntil: "domcontentloaded" })
        await expect(page.locator("body")).toBeVisible()

        const metrics = await page.evaluate(() => {
          const root = document.documentElement
          const body = document.body

          return {
            clientWidth: root.clientWidth,
            scrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
          }
        })

        expect(
          metrics.scrollWidth,
          `${publicPage.path} overflowed at ${viewport.label}`,
        ).toBeLessThanOrEqual(metrics.clientWidth + 2)
      })
    }
  }
})
