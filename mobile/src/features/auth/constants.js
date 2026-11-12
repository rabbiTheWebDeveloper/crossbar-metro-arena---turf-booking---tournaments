/** Shared by the login and register screens. */

/** Bangladeshi mobile number in its 11-digit "01XXXXXXXXX" form (run `cleanPhone` first). */
export const PHONE_RE = /^01[3-9]\d{8}$/;

/** Playing positions offered at sign-up (shown on squad cards). */
export const SIGNUP_POSITIONS = [
    { id: 'GK', label: 'GK', desc: 'Goalkeeper' },
    { id: 'DEF', label: 'DEF', desc: 'Defender' },
    { id: 'MID', label: 'MID', desc: 'Midfielder' },
    { id: 'FWD', label: 'FWD', desc: 'Forward' }
];

export const FORGOT_PASSWORD_HELP = 'Password reset by SMS is not available yet. Message the arena desk on WhatsApp from your registered number and the team will reset it for you.';
