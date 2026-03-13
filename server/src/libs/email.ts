import { Resend } from 'resend';
import { env } from '@config/env.js';
import { logger } from '@libs/logger.js';
import { InternalError } from '@shared/errors/errors.js';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    const { error } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      logger.error({ error, to: options.to }, 'Resend API returned an error');
      throw new InternalError('Failed to send email');
    }

    logger.debug({ to: options.to, subject: options.subject }, 'Email sent successfully');
  } catch (err) {
    if (err instanceof InternalError) throw err;
    logger.error({ err, to: options.to }, 'Failed to send email');
    throw new InternalError('Failed to send email');
  }
}

// ─── Shared Template ─────────────────────────────────────────

interface EmailTemplateOptions {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}

function buildEmailHtml(options: EmailTemplateOptions): string {
  const { heading, body, ctaLabel, ctaUrl, footerNote } = options;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#111111;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" style="max-width:420px;width:100%;">
          <!-- Brand -->
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <span style="font-size:15px;font-weight:700;color:#ffffff;letter-spacing:-0.03em;">Project Wind</span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:28px 24px 24px;">
              <!-- Heading -->
              <h1 style="margin:0 0 6px;font-size:18px;font-weight:600;color:#ffffff;line-height:1.3;">${heading}</h1>
              <!-- Body -->
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#888888;">${body}</p>
              <!-- CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:10px 28px;background-color:#ffffff;color:#111111;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              <!-- Fallback -->
              <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#555555;word-break:break-all;">${ctaUrl}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:#555555;">${footerNote}</p>
              <p style="margin:0;font-size:11px;color:#333333;">&copy; ${year} Project Wind</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Email Senders ───────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const verificationUrl = `${env.SERVER_URL}/api/v1/auth/verify-email?token=${token}`;

  if (env.NODE_ENV === 'development') {
    logger.info({ verificationUrl, email }, 'Verification email link (dev mode)');
  }

  const html = buildEmailHtml({
    heading: 'Verify your email',
    body: `Hi ${firstName}, confirm your email to start using Project Wind. This link expires in 24 hours.`,
    ctaLabel: 'Verify email',
    ctaUrl: verificationUrl,
    footerNote: "If you didn't create an account, ignore this email.",
  });

  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  if (env.NODE_ENV === 'development') {
    logger.info({ resetUrl, email }, 'Password reset link (dev mode)');
  }

  const html = buildEmailHtml({
    heading: 'Reset your password',
    body: `Hi ${firstName}, we received a password reset request. This link expires in 1 hour.`,
    ctaLabel: 'Reset password',
    ctaUrl: resetUrl,
    footerNote: "If you didn't request this, ignore this email.",
  });

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html,
  });
}
