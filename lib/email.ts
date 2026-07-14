// Transactional email: signup verification codes and password-reset links.
//
// Sending goes through the Resend HTTP API with plain fetch — no SDK, no new
// dependencies (same approach as the Google OAuth integration). Configure it
// with RESEND_API_KEY (+ EMAIL_FROM once you have a verified domain); see
// .env.example.
//
// Local-dev fallback: when RESEND_API_KEY is not set, the email is printed to
// the server console instead (so you can grab the code/link from the terminal)
// and the server logs a loud warning. Never deploy publicly in that state —
// visitors would never receive their codes.

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

// Resend's shared onboarding sender works out of the box with just an API
// key, but only delivers to the Resend account owner's own address. For real
// users, verify a domain in Resend and set EMAIL_FROM.
const DEFAULT_FROM = "Helagi <onboarding@resend.dev>";

let warnedConsole = false;

// Returns true when the email was handed off (or printed, in the dev
// fallback). Callers treat false as "tell the user to try again".
export async function sendEmail(
  to: string,
  content: EmailContent,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (!warnedConsole) {
      warnedConsole = true;
      console.warn(
        "[email] RESEND_API_KEY not set — emails are printed to this console " +
          "instead of being sent. Configure Resend before deploying publicly.",
      );
    }
    console.log(
      `[email] To: ${to}\n[email] Subject: ${content.subject}\n${content.text}`,
    );
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to: [to],
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    });
    if (!res.ok) {
      console.error(
        "[email] send failed:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

// ── Templates ────────────────────────────────────────────────────────────────
// Kept deliberately simple: inline styles only (email clients strip
// stylesheets), brand colors from tailwind.config.ts, and a plain-text
// alternative for every message. Values interpolated below are always
// server-generated (a 6-digit code, a URL built from our own base URL) —
// never user input — so no HTML escaping is needed.

function shell(inner: string): string {
  return `
  <div style="margin:0;padding:32px 16px;background-color:#F6F1E7;font-family:ui-sans-serif,system-ui,Arial,sans-serif;">
    <div style="max-width:440px;margin:0 auto;background-color:#ffffff;border-radius:16px;padding:32px 28px;">
      <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#143B2C;">Helagi</p>
      ${inner}
      <p style="margin:24px 0 0;font-size:12px;line-height:18px;color:#23332B;opacity:0.55;">
        Helagi provides general health information and never replaces a doctor.
        This email was sent because someone entered this address on helagi — if
        it wasn't you, you can safely ignore it.
      </p>
    </div>
  </div>`;
}

export function verificationCodeEmail(code: string): EmailContent {
  return {
    subject: `${code} is your Helagi verification code`,
    text:
      `Your Helagi verification code is: ${code}\n\n` +
      "Enter it on the sign-up page to confirm your email address. " +
      "The code expires in 15 minutes.\n\n" +
      "If you didn't create a Helagi account, you can safely ignore this email.",
    html: shell(`
      <p style="margin:0 0 12px;font-size:15px;line-height:24px;color:#23332B;">
        Enter this code on the sign-up page to confirm your email address:
      </p>
      <p style="margin:0 0 12px;font-size:32px;letter-spacing:8px;font-weight:700;color:#1F5C45;">${code}</p>
      <p style="margin:0;font-size:13px;line-height:20px;color:#23332B;opacity:0.7;">
        The code expires in 15 minutes.
      </p>`),
  };
}

export function passwordResetEmail(link: string): EmailContent {
  return {
    subject: "Reset your Helagi password",
    text:
      "Someone (hopefully you) asked to reset the password for this Helagi " +
      `account.\n\nOpen this link to choose a new password:\n${link}\n\n` +
      "The link works for 30 minutes. If you didn't ask for this, you can " +
      "safely ignore this email — your password stays unchanged.",
    html: shell(`
      <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#23332B;">
        Someone (hopefully you) asked to reset the password for this Helagi
        account. Click the button to choose a new one:
      </p>
      <p style="margin:0 0 16px;">
        <a href="${link}" style="display:inline-block;background-color:#1F5C45;color:#F6F1E7;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:999px;">
          Choose a new password
        </a>
      </p>
      <p style="margin:0;font-size:13px;line-height:20px;color:#23332B;opacity:0.7;">
        The link works for 30 minutes. If you didn't ask for this, ignore this
        email — your password stays unchanged.
      </p>`),
  };
}
