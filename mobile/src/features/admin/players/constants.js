export const ROLES = ['player', 'admin', 'investor', 'visitor'];
export const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'];

/** Tone (see theme.tones) of each account role. */
export const ROLE_TONES = { admin: 'warning', investor: 'info', player: 'success', visitor: 'neutral' };

export const digitsOnly = (value) => String(value || '').replace(/[^0-9]/g, '');
