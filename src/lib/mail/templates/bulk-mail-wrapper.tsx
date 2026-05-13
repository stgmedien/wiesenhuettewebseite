import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";

type Props = {
  subject: string;
  bodyHtml: string; // Markdown→HTML (vom Manager-Editor)
  firstName: string;
  optOutUrl: string;
};

const main = { backgroundColor: "#F7F7F2", padding: "40px 0" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "32px",
  maxWidth: "600px",
  borderRadius: "20px",
};
const greeting = {
  fontSize: "16px",
  lineHeight: 1.55,
  color: "#111111",
  margin: "0 0 14px 0",
};
const footer = {
  fontSize: "12px",
  color: "#5b5b56",
  lineHeight: 1.5,
  margin: "0",
};
const optOutLink = {
  color: "#5b5b56",
  textDecoration: "underline",
};

export default function BulkMailWrapper({
  subject,
  bodyHtml,
  firstName,
  optOutUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}>Hallo {firstName},</Text>
          {/* Markdown-to-HTML rendered from manager input. dangerouslySetInnerHTML
              is OK here because (a) only authenticated managers can compose,
              (b) markdown is sanitized vorher. */}
          <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <Hr style={{ borderColor: "#C8CEC4", margin: "32px 0 16px 0" }} />
          <Text style={footer}>
            Diese Mail kommt von den Skifreunden Gütersloh e.V. — wir schreiben
            Dir nur ab und zu, wenn etwas Wichtiges rund um die Wiesenhütte ansteht.
            Falls Du keine weiteren Newsletter erhalten möchtest:{" "}
            <a href={optOutUrl} style={optOutLink}>
              hier abmelden
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
