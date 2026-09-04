import nodemailer from "nodemailer";

export async function sendAuthEmail(to: string, subject: string, text: string) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecure = process.env.SMTP_SECURE;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM;

  if (!smtpHost || !smtpPort || !smtpSecure || !smtpUser || !smtpPass || !smtpFrom) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM must be configured");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: smtpSecure === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });

  await transporter.sendMail({ from: smtpFrom, to, subject, text });
}