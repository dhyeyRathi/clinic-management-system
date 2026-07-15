import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_RESEND_API_TOKEN);

export async function sendStaffWelcomeEmail({
  to,
  name,
  role,
  resetLink,
}: {
  to: string;
  name: string;
  role: string;
  resetLink: string;
}) {
  const roleLabel = role.replace("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const { error } = await resend.emails.send({
    from: "ClinicFlow <onboarding@resend.dev>",
    to,
    subject: `Welcome to ClinicFlow — Set Your Password`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to ClinicFlow</title>
      </head>
      <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
          <tr>
            <td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:32px 40px;text-align:center;">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
                        <span style="color:#fff;font-weight:800;font-size:18px;">C</span>
                      </div>
                      <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">ClinicFlow</span>
                    </div>
                    <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:8px 0 0;">Management Portal</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 40px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${name}! 👋</h1>
                    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                      Your <strong style="color:#111827;">${roleLabel}</strong> account has been created on ClinicFlow by your clinic manager. 
                      To get started, you need to set your own password by clicking the button below.
                    </p>

                    <!-- Alert box -->
                    <div style="background:#fef9c3;border:1px solid #fcd34d;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
                      <p style="margin:0;font-size:13px;color:#92400e;">
                        ⚠️ <strong>This link expires in 24 hours.</strong> Please set your password before it expires.
                      </p>
                    </div>

                    <!-- CTA Button -->
                    <div style="text-align:center;margin-bottom:28px;">
                      <a href="${resetLink}" 
                         style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;">
                        Set My Password →
                      </a>
                    </div>

                    <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;text-align:center;">
                      Or copy and paste this URL into your browser:
                    </p>
                    <p style="margin:0;font-size:11px;color:#6366f1;text-align:center;word-break:break-all;">
                      ${resetLink}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
                    <p style="margin:0;color:#9ca3af;font-size:12px;">
                      If you did not expect this email, please ignore it or contact your clinic administrator.<br />
                      © ${new Date().getFullYear()} ClinicFlow. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}
