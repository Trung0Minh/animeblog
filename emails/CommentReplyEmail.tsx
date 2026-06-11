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

interface CommentReplyEmailProps {
  postTitle: string
  postUrl: string
  repliedByName: string
  replyContent: string
  toName: string
}

export function CommentReplyEmail({
  postTitle,
  postUrl,
  repliedByName,
  replyContent,
  toName,
}: CommentReplyEmailProps) {
  const previewContent =
    replyContent.length > 300 ? `${replyContent.slice(0, 300)}...` : replyContent

  return (
    <Html>
      <Head />
      <Preview>
        {repliedByName} replied to your comment on {postTitle}
      </Preview>
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
            New reply to your comment
          </Text>
          <Text style={{ color: "#52525b", lineHeight: "1.6" }}>
            Hi {toName}, <strong>{repliedByName}</strong> replied to your
            comment on <strong>{postTitle}</strong>.
          </Text>
          <Container
            style={{
              backgroundColor: "#f4f4f5",
              borderLeft: "3px solid #a1a1aa",
              borderRadius: "6px",
              margin: "20px 0",
              padding: "16px",
            }}
          >
            <Text
              style={{
                color: "#3f3f46",
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {previewContent}
            </Text>
          </Container>
          <Button
            href={postUrl}
            style={{
              backgroundColor: "#18181b",
              borderRadius: "6px",
              color: "#ffffff",
              display: "inline-block",
              fontSize: "14px",
              fontWeight: 600,
              marginTop: "8px",
              padding: "12px 28px",
              textDecoration: "none",
            }}
          >
            View reply
          </Button>
          <Hr style={{ borderColor: "#e4e4e7", margin: "32px 0" }} />
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            You are receiving this because you asked to be notified when someone
            replies to your comment.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
