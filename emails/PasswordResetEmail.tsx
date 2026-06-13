import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Text,
} from "@react-email/components"

interface PasswordResetEmailProps {
  resetUrl: string
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Anime Blog password</Preview>
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
            Reset your password
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            Use the button below to set a new Anime Blog password. This is a
            separate site password, not your Gmail password.
          </Text>
          <Button
            href={resetUrl}
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
            Reset password
          </Button>
          <Text style={{ color: "#71717a", fontSize: "13px", lineHeight: "1.6" }}>
            This link expires soon and can only be used once. If you did not
            request this, you can ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
