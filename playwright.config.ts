import { defineConfig, devices } from "@playwright/test"
import { loadEnvConfig } from "@next/env"

const mutableEnv = process.env as Record<string, string | undefined>
const originalNodeEnv = mutableEnv.NODE_ENV
mutableEnv.NODE_ENV = "development"
loadEnvConfig(process.cwd(), true, console, true)
if (originalNodeEnv === undefined) {
  delete mutableEnv.NODE_ENV
} else {
  mutableEnv.NODE_ENV = originalNodeEnv
}

function definedProcessEnv() {
  return Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  )
}

function requiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to .env.local or export it before running Playwright.`,
    )
  }

  return value
}

const webServerEnv = {
  ...definedProcessEnv(),
  DATABASE_URL: requiredEnv("DATABASE_URL"),
  DIRECT_URL: process.env.DIRECT_URL ?? requiredEnv("DATABASE_URL"),
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
  NEXTAUTH_SECRET: "playwright-test-secret",
  NEXTAUTH_URL: "http://127.0.0.1:3000",
  NODE_ENV: "test",
  PLAYWRIGHT_TEST: "1",
  RESEND_API_KEY: "re_test_fake_key",
  RESEND_FROM_EMAIL: "test@example.com",
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command:
      "WATCHPACK_POLLING=true npm run dev -- --hostname 127.0.0.1",
    env: webServerEnv,
    reuseExistingServer: false,
    url: "http://127.0.0.1:3000",
  },
})
