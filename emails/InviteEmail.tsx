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

interface InviteEmailProps {
  invitedByName: string
  inviteUrl: string
}

export function InviteEmail({ invitedByName, inviteUrl }: InviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to write on Anime Blog</Preview>
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
            You are invited
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            <strong>{invitedByName}</strong> has invited you to become a writer
            on Anime Blog. Use the button below to create your account.
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            During setup you will create a separate Anime Blog password. Do not
            use your Gmail password.
          </Text>
          <Button
            href={inviteUrl}
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
            Accept invitation
          </Button>
          <Hr style={{ borderColor: "#e4e4e7", margin: "32px 0" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            This link expires in 7 days. If you did not expect this email, you
            can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
