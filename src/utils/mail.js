import nodemailer from 'nodemailer';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLACEHOLDER_EMAIL_RE = /^01[3-9]\d{8}@bookcrossbar\.com$/i;

const getBaseUrl = () => {
    const raw =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '') ||
        'http://localhost:3000';
    return String(raw).replace(/\/+$/, '');
};

const getMailCredentials = () => ({
    user: (process.env.GMAIL_USER || '').trim(),
    pass: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim()
});

export function isMailConfigured() {
    const { user, pass } = getMailCredentials();
    return Boolean(user && pass);
}

/** True when `email` is a real email address (not blank and not an auto-generated phone placeholder). */
export function isDeliverableEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    if (!clean || !EMAIL_RE.test(clean)) return false;
    if (PLACEHOLDER_EMAIL_RE.test(clean)) return false;
    return true;
}

const getTransporter = () => {
    const { user, pass } = getMailCredentials();
    if (!user || !pass) {
        throw new Error('Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.');
    }
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
};

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const ROLE_LABELS = {
    admin: 'Arena Admin',
    staff: 'Arena Staff',
    investor: 'Investor Partner',
    player: 'Player / Customer',
    customer: 'Customer',
    visitor: 'Member'
};

function getEmailWrapper(contentHtml, title = 'Crossbar Metro Arena') {
    const year = new Date().getFullYear();
    const baseUrl = getBaseUrl();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0b1117;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b1117;padding:32px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 8px 30px rgba(0,0,0,0.28);border:1px solid #d1fae5;">
          <tr>
            <td style="background:linear-gradient(135deg,#062c22 0%,#0f5132 55%,#10b981 100%);
                        padding:28px 36px 24px;text-align:center;">
              <p style="color:#ffffff;font-size:26px;font-weight:800;margin:0;letter-spacing:0.8px;">
                CROSSBAR METRO ARENA
              </p>
              <p style="color:#a7f3d0;font-size:11px;margin:8px 0 0;text-transform:uppercase;
                         letter-spacing:2.4px;font-weight:700;">
                Uttara Metro Center &bull; Dhaka
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:34px 38px 28px;color:#0f172a;font-size:15px;line-height:1.7;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px;">
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc;padding:20px 36px 26px;text-align:center;">
              <p style="margin:0 0 6px;">
                <a href="${baseUrl}" style="color:#065f46;font-weight:700;font-size:13px;text-decoration:none;">
                  bookcrossbar.com
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#475569;">
                Hotline: <a href="tel:+8801796337133" style="color:#475569;text-decoration:none;">+880 1796-337133</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                This is an automated email from Crossbar Metro Arena.<br />
                &copy; ${year} Crossbar Metro Arena. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendWelcomeEmail({ toEmail, fullName, role = 'player', phone = '' }) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const roleLabel = ROLE_LABELS[role] || 'Member';
    const baseUrl = getBaseUrl();

    const textLines = [
        `Welcome to Crossbar Metro Arena, ${fullName}!`,
        '',
        `Your ${roleLabel} account has been created.`,
        `Email: ${toEmail}`,
        phone ? `Mobile: ${phone}` : '',
        '',
        `Log in anytime using your mobile number or email at: ${baseUrl}/login`,
        '',
        'You can verify your email address inside your account settings.'
    ].filter(Boolean);

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: `Welcome to Crossbar Metro Arena — ${roleLabel} Account Created`,
        text: textLines.join('\n'),
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:21px;margin:0 0 14px;">Welcome, ${escapeHtml(fullName)}!</h2>
          <p style="margin:0 0 14px;color:#334155;">
            Your <strong>${escapeHtml(roleLabel)}</strong> account at <strong>Crossbar Metro Arena</strong> has been successfully created.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;margin:18px 0;">
            <p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Account Type:</strong> ${escapeHtml(roleLabel)}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Email:</strong> ${escapeHtml(toEmail)}</p>
            ${phone ? `<p style="margin:0;font-size:13px;color:#166534;"><strong>Mobile:</strong> ${escapeHtml(phone)}</p>` : ''}
          </div>
          <div style="text-align:center;margin:26px 0;">
            <a href="${baseUrl}/login"
               style="background:#059669;color:#ffffff;padding:13px 32px;text-decoration:none;
                      border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
              Sign In to Your Account
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#64748b;">
            You can log in with either your mobile number or email address, and verify your email from your account settings.
          </p>
        `, 'Welcome to Crossbar Metro Arena')
    });
}

/** Safe wrapper for account creation routes: never throws or blocks signup/create. */
export async function safeSendWelcomeEmail(params) {
    if (!isDeliverableEmail(params?.toEmail)) {
        return { sent: false, reason: 'no_deliverable_email' };
    }
    if (!isMailConfigured()) {
        console.warn('[MAIL] Skipping welcome email: GMAIL_USER / GMAIL_APP_PASSWORD not configured.');
        return { sent: false, reason: 'mail_not_configured' };
    }
    try {
        await sendWelcomeEmail(params);
        return { sent: true };
    } catch (err) {
        console.error('[MAIL] Welcome email failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

const OTP_EMAIL_COPY = {
    'verify-email': {
        subject: 'Crossbar Metro Arena — Email Verification Code',
        heading: 'Verify Your Email Address',
        intro: 'to verify the email address on your Crossbar Metro Arena account',
        ignore: 'If you did not request this verification, you can safely ignore this email.'
    },
    'password-reset': {
        subject: 'Crossbar Metro Arena — Password Reset Code',
        heading: 'Reset Your Password',
        intro: 'to reset the password for your Crossbar Metro Arena account',
        ignore: 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.'
    }
};

export async function sendEmailOtp({ toEmail, fullName, code, expiresInMinutes = 15, purpose = 'verify-email' }) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const copy = OTP_EMAIL_COPY[purpose];
    if (!copy) throw new Error(`Unknown OTP email purpose: ${purpose}`);

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: copy.subject,
        text: `Hello ${fullName},\n\nYour Crossbar Metro Arena code is ${code}. Use it ${copy.intro}.\nThis code expires in ${expiresInMinutes} minutes. Do not share it with anyone.\n\n${copy.ignore}`,
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:20px;margin:0 0 12px;">${copy.heading}</h2>
          <p style="margin:0 0 12px;color:#334155;">Hello <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin:0 0 16px;color:#334155;">
            Use this <strong>${String(code).length}-digit verification code</strong> ${copy.intro}:
          </p>
          <div style="text-align:center;margin:26px 0;">
            <div style="font-size:34px;font-weight:800;color:#065f46;background:#ecfdf5;
                        padding:16px 34px;display:inline-block;border-radius:12px;
                        letter-spacing:10px;border:2px solid #a7f3d0;font-family:monospace;">
              ${escapeHtml(code)}
            </div>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#475569;">
            This code is valid for <strong>${expiresInMinutes} minutes</strong>. Never share it with anyone.
          </p>
          <p style="margin:0;font-size:12px;color:#94a3b8;">${copy.ignore}</p>
        `, copy.subject)
    });
}

export async function sendPasswordChangedEmail({ toEmail, fullName }) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const baseUrl = getBaseUrl();

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: 'Crossbar Metro Arena — Your Password Was Reset',
        text: `Hello ${fullName},\n\nYour Crossbar Metro Arena account password was just reset using a verification code sent to this email.\n\nIf this was not you, contact the arena desk right away on +880 1796-337133.`,
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:20px;margin:0 0 14px;">Password Updated Successfully</h2>
          <p style="margin:0 0 12px;color:#334155;">Hello <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin:0 0 16px;color:#334155;">
            The password for your Crossbar Metro Arena account was just <strong>reset</strong> using a code sent to this email address.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${baseUrl}/login"
               style="background:#059669;color:#ffffff;padding:12px 30px;text-decoration:none;
                      border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
              Sign In Now
            </a>
          </div>
          <p style="margin:0;color:#b91c1c;font-size:13px;">
            If you did not perform this reset, please contact Crossbar Metro Arena support immediately at
            <a href="tel:+8801796337133" style="color:#b91c1c;font-weight:700;">+880 1796-337133</a>.
          </p>
        `, 'Password Updated')
    });
}

export async function sendInvestorWelcomeEmail({
    toEmail,
    fullName,
    phone = '',
    sharePercentage = 0,
    capitalInvested = 0,
    password = ''
}) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const baseUrl = getBaseUrl();
    const formattedCapital = `৳${Math.round(Number(capitalInvested) || 0).toLocaleString('en-IN')}`;
    const shareText = `${Number(sharePercentage) || 0}%`;

    const textLines = [
        `Welcome to Crossbar Metro Arena, ${fullName}!`,
        '',
        'Your Investor Partner account at Crossbar Metro Arena is ready.',
        `Equity Share: ${shareText}`,
        `Invested Amount: ${formattedCapital}`,
        phone ? `Login Mobile: ${phone}` : '',
        `Login Email: ${toEmail}`,
        password ? `Temporary Password: ${password}` : '',
        '',
        `Sign in to your Investor Portal at: ${baseUrl}/login`,
        password ? 'For your security, please change your password under Settings once you sign in.' : ''
    ].filter(Boolean);

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: 'Welcome to Crossbar Metro Arena — Investor Partner Account Created',
        text: textLines.join('\n'),
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:21px;margin:0 0 14px;">Welcome, ${escapeHtml(fullName)}!</h2>
          <p style="margin:0 0 14px;color:#334155;">
            Your <strong>Investor Partner</strong> account at <strong>Crossbar Metro Arena</strong> has been created.
            You can track live arena revenue, monthly profit share, and payout history from your investor portal.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;margin:18px 0;">
            <p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Account Type:</strong> Investor Partner</p>
            <p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Equity Share:</strong> ${escapeHtml(shareText)}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Invested Amount:</strong> ${escapeHtml(formattedCapital)}</p>
            ${phone ? `<p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Login Mobile:</strong> ${escapeHtml(phone)}</p>` : ''}
            <p style="margin:0;font-size:13px;color:#166534;"><strong>Login Email:</strong> ${escapeHtml(toEmail)}</p>
          </div>
          ${password ? `
          <div style="background:#ecfdf5;border:2px solid #6ee7b7;border-radius:10px;padding:16px 18px;margin:18px 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#065f46;font-weight:700;">
              Temporary Login Password
            </p>
            <p style="margin:0;font-size:24px;font-weight:800;color:#064e3b;font-family:monospace;letter-spacing:2px;">
              ${escapeHtml(password)}
            </p>
            <p style="margin:8px 0 0;font-size:12px;color:#047857;">
              Please change this password in <strong>Investor Portal &rarr; Settings</strong> after signing in.
            </p>
          </div>` : ''}
          <div style="text-align:center;margin:26px 0;">
            <a href="${baseUrl}/login"
               style="background:#059669;color:#ffffff;padding:13px 32px;text-decoration:none;
                      border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
              Sign In to Investor Portal
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#64748b;">
            Sign in with either your mobile number or email address. Need help? Contact the arena desk anytime.
          </p>
        `, 'Welcome to Crossbar Metro Arena — Investor Account')
    });
}

/** Safe wrapper for investor creation routes: never throws or blocks saving. */
export async function safeSendInvestorWelcomeEmail(params) {
    if (!isDeliverableEmail(params?.toEmail)) {
        return { sent: false, reason: 'no_deliverable_email' };
    }
    if (!isMailConfigured()) {
        console.warn('[MAIL] Skipping investor welcome email: GMAIL_USER / GMAIL_APP_PASSWORD not configured.');
        return { sent: false, reason: 'mail_not_configured' };
    }
    try {
        await sendInvestorWelcomeEmail(params);
        return { sent: true, toEmail: String(params.toEmail).trim().toLowerCase() };
    } catch (err) {
        console.error('[MAIL] Investor welcome email failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

export async function sendAdminPasswordResetEmail({ toEmail, fullName, phone = '', newPassword, role = 'investor' }) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const baseUrl = getBaseUrl();
    const roleLabel = ROLE_LABELS[role] || 'Member';

    const textLines = [
        `Hello ${fullName},`,
        '',
        `An administrator at Crossbar Metro Arena has reset the password for your ${roleLabel} account.`,
        phone ? `Login Mobile: ${phone}` : '',
        `Login Email: ${toEmail}`,
        `New Password: ${newPassword}`,
        '',
        `Sign in at: ${baseUrl}/login`,
        'For your security, please update your password from Account Settings after signing in.',
        'If you did not expect this change, contact the arena desk right away on +880 1796-337133.'
    ].filter(Boolean);

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: 'Crossbar Metro Arena — Your Account Password Has Been Reset',
        text: textLines.join('\n'),
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:20px;margin:0 0 14px;">Your Password Has Been Reset</h2>
          <p style="margin:0 0 12px;color:#334155;">Hello <strong>${escapeHtml(fullName)}</strong>,</p>
          <p style="margin:0 0 16px;color:#334155;">
            Crossbar Metro Arena management has set a new password for your <strong>${escapeHtml(roleLabel)}</strong> login account.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 18px;margin:18px 0;">
            ${phone ? `<p style="margin:0 0 6px;font-size:13px;color:#166534;"><strong>Login Mobile:</strong> ${escapeHtml(phone)}</p>` : ''}
            <p style="margin:0 0 10px;font-size:13px;color:#166534;"><strong>Login Email:</strong> ${escapeHtml(toEmail)}</p>
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#065f46;font-weight:700;">New Password</p>
            <div style="font-size:24px;font-weight:800;color:#064e3b;background:#ecfdf5;padding:12px 18px;
                        border-radius:10px;border:2px solid #a7f3d0;font-family:monospace;letter-spacing:2px;text-align:center;">
              ${escapeHtml(newPassword)}
            </div>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${baseUrl}/login"
               style="background:#059669;color:#ffffff;padding:12px 30px;text-decoration:none;
                      border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
              Sign In Now
            </a>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:#475569;">
            We recommend changing this password under <strong>Settings</strong> after signing in.
          </p>
          <p style="margin:0;color:#b91c1c;font-size:12px;">
            If you did not expect this password reset, please contact Crossbar Metro Arena immediately at
            <a href="tel:+8801796337133" style="color:#b91c1c;font-weight:700;">+880 1796-337133</a>.
          </p>
        `, 'Password Reset — Crossbar Metro Arena')
    });
}

export async function safeSendAdminPasswordResetEmail(params) {
    if (!isDeliverableEmail(params?.toEmail)) {
        return { sent: false, reason: 'no_deliverable_email' };
    }
    if (!isMailConfigured()) {
        console.warn('[MAIL] Skipping admin password reset email: GMAIL_USER / GMAIL_APP_PASSWORD not configured.');
        return { sent: false, reason: 'mail_not_configured' };
    }
    try {
        await sendAdminPasswordResetEmail(params);
        return { sent: true, toEmail: String(params.toEmail).trim().toLowerCase() };
    } catch (err) {
        console.error('[MAIL] Admin password reset email failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

export async function sendBookingConfirmationEmail({
    toEmail,
    booking,
    paidAmount = 0,
    gateway = ''
}) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    const baseUrl = getBaseUrl();
    const total = Number(booking?.totalPrice || 0);
    const paid = Number(paidAmount || booking?.advanceAmount || 0);
    const due = Number(booking?.dueAmount ?? Math.max(0, total - paid));
    const fmt = (n) => `৳${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;
    const code = booking?.bookingCode || '';
    const teamName = booking?.teamName || 'Squad';
    const captainName = booking?.captainName || 'Player';
    const slotText = booking?.displayTime || (booking?.slotNumber ? `Slot #${booking.slotNumber}` : '');
    const payLabel = gateway || booking?.paymentMethod || 'Online';

    const textLines = [
        `Thank you for booking at Crossbar Metro Arena, ${captainName}!`,
        '',
        'Your turf slot booking & payment have been confirmed.',
        `Booking Code: ${code}`,
        `Team / Squad: ${teamName}`,
        `Match Date: ${booking?.date || ''}`,
        `Kickoff Slot: ${slotText}`,
        `Total Price: ${fmt(total)}`,
        `Paid (${payLabel}): ${fmt(paid)}`,
        `Due at Arena: ${fmt(due)}`,
        booking?.transactionId ? `Transaction ID: ${booking.transactionId}` : '',
        '',
        'Please arrive 15 minutes before kickoff. Turf shoes (TF) or rubber molded studs (AG) only.',
        `View your booking: ${baseUrl}/booking`
    ].filter(Boolean);

    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject: `Crossbar Metro Arena — Booking Confirmed (${code})`,
        text: textLines.join('\n'),
        html: getEmailWrapper(`
          <h2 style="color:#064e3b;font-size:21px;margin:0 0 12px;">Booking &amp; Payment Confirmed!</h2>
          <p style="margin:0 0 16px;color:#334155;">
            Hello <strong>${escapeHtml(captainName)}</strong>, thank you for booking with <strong>Crossbar Metro Arena</strong>.
            Your slot is locked and ready for match day.
          </p>
          <div style="background:#ecfdf5;border:2px solid #6ee7b7;border-radius:12px;padding:16px 20px;margin:18px 0;text-align:center;">
            <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;color:#065f46;font-weight:700;">
              Booking Reference Code
            </p>
            <p style="margin:0;font-size:26px;font-weight:800;color:#064e3b;font-family:monospace;letter-spacing:2px;">
              ${escapeHtml(code)}
            </p>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;margin:18px 0;">
            <p style="margin:0 0 6px;font-size:13px;color:#0f172a;"><strong>Squad / Team:</strong> ${escapeHtml(teamName)}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#0f172a;"><strong>Match Date:</strong> ${escapeHtml(booking?.date || '')}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#0f172a;"><strong>Kickoff Time:</strong> ${escapeHtml(slotText)}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#0f172a;"><strong>Total Price:</strong> ${escapeHtml(fmt(total))}</p>
            <p style="margin:0 0 6px;font-size:13px;color:#047857;"><strong>Paid (${escapeHtml(payLabel)}):</strong> ${escapeHtml(fmt(paid))}</p>
            <p style="margin:0${booking?.transactionId ? ' 0 6px' : ''};font-size:13px;color:${due > 0 ? '#b45309' : '#047857'};"><strong>Due at Arena:</strong> ${escapeHtml(due > 0 ? fmt(due) : '৳0 (Paid in full)')}</p>
            ${booking?.transactionId ? `<p style="margin:0;font-size:12px;color:#64748b;"><strong>Transaction ID:</strong> ${escapeHtml(booking.transactionId)}</p>` : ''}
          </div>
          <div style="text-align:center;margin:24px 0;">
            <a href="${baseUrl}/booking"
               style="background:#059669;color:#ffffff;padding:12px 30px;text-decoration:none;
                      border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
              View Booking &amp; Match Pass
            </a>
          </div>
          <p style="margin:0;font-size:12px;color:#64748b;">
            Please arrive 15 minutes before kickoff at Uttara Metro Center, Sector 17, Dhaka. Turf shoes (TF) or rubber molded studs (AG) only.
          </p>
        `, `Booking Confirmed — ${code}`)
    });
}

export async function safeSendBookingConfirmationEmail(params) {
    if (!isDeliverableEmail(params?.toEmail)) {
        return { sent: false, reason: 'no_deliverable_email' };
    }
    if (!isMailConfigured()) {
        console.warn('[MAIL] Skipping booking confirmation email: GMAIL_USER / GMAIL_APP_PASSWORD not configured.');
        return { sent: false, reason: 'mail_not_configured' };
    }
    try {
        await sendBookingConfirmationEmail(params);
        return { sent: true, toEmail: String(params.toEmail).trim().toLowerCase() };
    } catch (err) {
        console.error('[MAIL] Booking confirmation email failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

export async function sendCustomEmail({ toEmail, subject, htmlBody }) {
    const transporter = getTransporter();
    const { user: fromEmail } = getMailCredentials();
    await transporter.sendMail({
        from: `"Crossbar Metro Arena" <${fromEmail}>`,
        to: toEmail,
        subject,
        html: getEmailWrapper(htmlBody, subject)
    });
}
