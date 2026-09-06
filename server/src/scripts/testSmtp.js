import nodemailer from "nodemailer";
import { env } from "../config/env.js";

async function main() {
  console.log("Testing SMTP…");
  console.log(`Host: ${env.smtp.host}:${env.smtp.port} secure=${env.smtp.secure}`);
  console.log(`User: ${env.smtp.user}`);
  console.log(`From: ${env.emailFrom}`);

  if (!env.smtp.user || !env.smtp.pass) {
    throw new Error("Set SMTP_USER and SMTP_PASS in server/.env first.");
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    requireTLS: !env.smtp.secure && env.smtp.port === 587,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    tls: { minVersion: "TLSv1.2" },
  });

  await transporter.verify();
  console.log("SMTP auth OK.");

  const to = process.argv[2] || env.emailStaffTo || env.smtp.user;
  const info = await transporter.sendMail({
    from: `"${env.clinicName}" <${env.emailFrom}>`,
    to,
    subject: "Mukhija clinic SMTP test",
    text: "If you received this, GoDaddy/Titan SMTP is working for the appointment API.",
  });
  console.log(`Test email sent to ${to}`);
  console.log(`messageId=${info.messageId}`);
}

main().catch((error) => {
  console.error("SMTP test failed:", error.message);
  console.error(`
If auth failed (535):
1. Open Titan webmail for appointments@…
2. Settings → enable "Titan on other apps" / third-party access
3. Turn OFF 2FA on that mailbox (Titan blocks SMTP when 2FA is on)
4. Confirm SMTP_PASS is the webmail password
5. Retry: npm --prefix server run test:smtp
`);
  process.exit(1);
});
