export const AUTH_SESSION_COOKIE_NAME = "authjs.session-token"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7
export const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24

export function getAuthSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || undefined
}
