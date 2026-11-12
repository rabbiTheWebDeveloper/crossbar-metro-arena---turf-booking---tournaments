export const RESULT_TABS = [
    { key: 'pending_approval', label: 'Pending' },
    { key: 'published', label: 'Published' },
    { key: 'rejected', label: 'Rejected' }
];

export const EMPTY_COPY = {
    pending_approval: 'No scorecards waiting for approval. Captain submissions appear here when "Approve match results first" is on.',
    published: 'No published results yet. Approved scorelines show here and feed the public league table.',
    rejected: 'No rejected results. Rejected scorelines stay here for reference and can be deleted.'
};

export const EVENT_LABEL = { goal: 'Goal', own_goal: 'Own goal', assist: 'Assist', yellow: 'Yellow card', red: 'Red card' };

/** "45'" or '' when the minute was not recorded. */
export const minuteLabel = (minute) => (minute !== null && minute !== undefined && minute !== '' ? `${minute}'` : '');

/** Newest match date first; same day: most recently posted first. */
export const sortResults = (list) => [...list].sort((a, b) => {
    const da = String(a.date || '');
    const db = String(b.date || '');
    if (da === db) return String(b.postedAt || '').localeCompare(String(a.postedAt || ''));
    return da < db ? 1 : -1;
});
