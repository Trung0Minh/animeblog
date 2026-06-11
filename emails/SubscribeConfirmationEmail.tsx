import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components"

interface SubscribeConfirmationEmailProps {
  appName: string
  appUrl: string
}

export function SubscribeConfirmationEmail({
  appName,
  appUrl,
}: SubscribeConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You are now subscribed to {appName}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            margin: "0 auto",
            maxWidth: "520px",
            padding: "40px",
          }}
        >
          <Text
            style={{
              color: "#111111",
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 8px",
            }}
          >
            You are subscribed
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            Thanks for subscribing to <strong>{appName}</strong>. You will get
            an email whenever a new essay is published.
          </Text>
          <Button
            href={appUrl}
            style={{
              backgroundColor: "#18181b",
              borderRadius: "6px",
              color: "#ffffff",
              display: "inline-block",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "24px",
              padding: "12px 28px",
              textDecoration: "none",
            }}
          >
            Read the latest posts
          </Button>
          <Hr style={{ borderColor: "#e4e4e7", margin: "32px 0" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            You can unsubscribe at any time by clicking the unsubscribe link in
            any newsletter email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
