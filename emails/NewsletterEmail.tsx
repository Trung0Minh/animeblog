import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components"

interface FeaturedPost {
  coverUrl: string | null
  excerpt: string | null
  title: string
  url: string
}

interface NewsletterEmailProps {
  appName: string
  customBody?: string
  featuredPost: FeaturedPost | null
  previewText?: string
  subject: string
  unsubscribeUrl: string
}

export function NewsletterEmail({
  appName,
  customBody,
  featuredPost,
  previewText,
  subject,
  unsubscribeUrl,
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText ?? subject}</Preview>
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
              color: "#a1a1aa",
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: "0 0 24px",
              textTransform: "uppercase",
            }}
          >
            {appName}
          </Text>
          <Text
            style={{
              color: "#111111",
              fontSize: "24px",
              fontWeight: 700,
              lineHeight: "1.25",
              margin: "0 0 12px",
            }}
          >
            {subject}
          </Text>

          {customBody && (
            <Text
              style={{
                color: "#3f3f46",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
            >
              {customBody}
            </Text>
          )}

          {featuredPost && (
            <Container
              style={{
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                marginTop: "24px",
                overflow: "hidden",
                padding: 0,
              }}
            >
              {featuredPost.coverUrl && (
                <Img
                  alt={featuredPost.title}
                  height="260"
                  src={featuredPost.coverUrl}
                  style={{
                    display: "block",
                    height: "auto",
                    maxHeight: "260px",
                    objectFit: "cover",
                    width: "100%",
                  }}
                  width="520"
                />
              )}
              <Container style={{ padding: "20px" }}>
                <Text
                  style={{
                    color: "#111111",
                    fontSize: "18px",
                    fontWeight: 700,
                    margin: "0 0 8px",
                  }}
                >
                  {featuredPost.title}
                </Text>
                {featuredPost.excerpt && (
                  <Text
                    style={{
                      color: "#52525b",
                      fontSize: "14px",
                      lineHeight: "1.6",
                      margin: "0 0 16px",
                    }}
                  >
                    {featuredPost.excerpt}
                  </Text>
                )}
                <Button
                  href={featuredPost.url}
                  style={{
                    backgroundColor: "#18181b",
                    borderRadius: "6px",
                    color: "#ffffff",
                    display: "inline-block",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "12px 24px",
                    textDecoration: "none",
                  }}
                >
                  Read post
                </Button>
              </Container>
            </Container>
          )}

          <Hr style={{ borderColor: "#e4e4e7", margin: "32px 0" }} />
          <Text style={{ color: "#71717a", fontSize: "12px", margin: 0 }}>
            You are receiving this because you subscribed to {appName}.{" "}
            <a href={unsubscribeUrl} style={{ color: "#71717a" }}>
              Unsubscribe
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
