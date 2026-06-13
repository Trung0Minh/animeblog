type AnalyticsEventData = Record<string, number | string>

interface AnalyticsPayload {
  data?: AnalyticsEventData
  eventName: string
  path: string
  sessionId: string
}

let sessionId: null | string = null

function getSessionId() {
  if (sessionId) {
    return sessionId
  }

  sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return sessionId
}

export function trackEvent(eventName: string, data?: AnalyticsEventData) {
  if (typeof window === "undefined") {
    return
  }

  const payload: AnalyticsPayload = {
    data,
    eventName,
    path: window.location.pathname,
    sessionId: getSessionId(),
  }
  const body = JSON.stringify(payload)

  try {
    if (navigator.sendBeacon?.("/api/analytics/events", body)) {
      return
    }
  } catch {
    // Ignore analytics failures; tracking must never affect user actions.
  }

  fetch("/api/analytics/events", {
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    method: "POST",
  }).catch(() => {
    // Ignore analytics failures; tracking must never affect user actions.
  })
}
