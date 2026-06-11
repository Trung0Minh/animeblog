type AnalyticsEventData = Record<string, number | string>

interface UmamiWindow extends Window {
  umami?: {
    track: (eventName: string, data?: AnalyticsEventData) => void
  }
}

export function trackEvent(eventName: string, data?: AnalyticsEventData) {
  if (typeof window === "undefined") {
    return
  }

  const { umami } = window as UmamiWindow

  if (!umami) {
    return
  }

  umami.track(eventName, data)
}
