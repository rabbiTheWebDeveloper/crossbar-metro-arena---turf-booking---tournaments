/** Payment methods accepted by PATCH /api/registrations/:id */
export const PAYMENT_METHODS = ['bkash', 'nagad', 'rocket', 'bank', 'card', 'cash', 'pay_at_turf'];
export const PAYMENT_METHOD_OPTIONS = PAYMENT_METHODS.map(m => ({ value: m, label: m.replace('_', ' ') }));

export const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed / approved' },
    { value: 'rejected', label: 'Rejected' }
];

export const FILTERS = ['all', 'pending', 'confirmed', 'rejected'];

/** Older records use "verified"; the model stores "confirmed". */
export const isConfirmed = (r) => r.status === 'confirmed' || r.status === 'verified';

/** Squad as a list of names, whatever shape the record uses. */
export const playersOf = (r) => {
    if (Array.isArray(r.playersList) && r.playersList.length) return r.playersList.map(p => String(p ?? '')).filter(Boolean);
    if (Array.isArray(r.players) && r.players.length) return r.players.map(p => (typeof p === 'string' ? p : p?.name)).filter(Boolean).map(String);
    return [];
};

export const linesToPlayers = (text) => String(text || '').split('\n').map(p => p.trim()).filter(Boolean);

export const registrationToForm = (r) => ({
    teamName: r.teamName || '',
    captainName: r.captainName || '',
    captainPhone: r.captainPhone || '',
    captainEmail: r.captainEmail || '',
    jerseyColor: r.jerseyColor || '',
    playersText: playersOf(r).join('\n'),
    paymentMethod: r.paymentMethod || 'bkash',
    transactionId: r.transactionId || '',
    amount: String(r.amount ?? 0),
    notes: r.notes || '',
    status: r.status === 'verified' ? 'confirmed' : (r.status || 'pending')
});

/** Case-insensitive search across team, captain, phone, cup and squad names. */
export const matchesRegistration = (r, q) => !q
    || String(r.teamName || '').toLowerCase().includes(q)
    || String(r.captainName || '').toLowerCase().includes(q)
    || String(r.captainPhone || '').includes(q)
    || String(r.tournamentTitle || '').toLowerCase().includes(q)
    || playersOf(r).some(p => p.toLowerCase().includes(q));
