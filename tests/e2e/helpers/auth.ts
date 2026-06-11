import { expect, type Page } from "@playwright/test"

type LoginRole = "ADMIN" | "WRITER"

interface LoginResponse {
  data?: {
    role: LoginRole
    userId: string
  }
  error?: string
}

async function loginAs(page: Page, role: LoginRole) {
  const response = await page.request.post("/api/test/login", {
    data: { role },
  })
  const payload = (await response.json()) as LoginResponse

  expect(response.ok(), payload.error).toBe(true)
  expect(payload.data?.role).toBe(role)
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, "ADMIN")
}

export async function loginAsWriter(page: Page) {
  await loginAs(page, "WRITER")
}
