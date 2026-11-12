import { isIsoDate } from '@/lib/dateUtils';
import { HTTP_URL_RE } from '../content/ImageUrlField';

export const CATEGORY_OPTIONS = ['7v7 Championship', '5v5 Knockout', 'Corporate League', 'Youth Cup', 'Ramadan Night Cup', 'Friendly Festival'];
export const FORMAT_OPTIONS = ['7 vs 7 Knockouts', '7 vs 7 League + Knockouts', '5 vs 5 Knockouts', '6 vs 6 Group Stage', 'Round Robin'];

/** Badge tone per tournament status (anything unknown renders neutral). */
export const TOURNAMENT_STATUS_TONE = { open: 'success', closed: 'warning', completed: 'neutral', cancelled: 'danger' };

export const linesToList = (s) => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);

const text = (v) => (v === null || v === undefined ? '' : String(v));

export const emptyTournamentForm = () => ({
    title: '', edition: '', category: CATEGORY_OPTIONS[0], format: FORMAT_OPTIONS[0], dates: '', registrationDeadline: '',
    entryFee: '', prizePool: '', firstPrize: '', runnerUpPrize: '', maxTeams: '16', bannerUrl: '', highlights: '', rules: ''
});

export const tournamentToForm = (t) => ({
    title: t.title || '',
    edition: t.edition || '',
    category: t.category || CATEGORY_OPTIONS[0],
    format: t.format || FORMAT_OPTIONS[0],
    dates: t.dates || '',
    registrationDeadline: isIsoDate(t.registrationDeadline) ? t.registrationDeadline : '',
    entryFee: text(t.entryFee),
    prizePool: text(t.prizePool),
    firstPrize: t.firstPrize || '',
    runnerUpPrize: t.runnerUpPrize || '',
    maxTeams: text(t.maxTeams ?? 16),
    bannerUrl: t.bannerUrl || '',
    highlights: (t.highlights || []).join('\n'),
    rules: (t.rules || []).join('\n')
});

/**
 * Validates the form exactly like the website and builds the API payload.
 * Returns { error } or { payload }.
 */
export function buildTournamentPayload(form, editing) {
    const title = form.title.trim();
    const dates = form.dates.trim();
    const feeText = text(form.entryFee).trim();
    const poolText = text(form.prizePool).trim();
    const bannerUrl = form.bannerUrl.trim();
    const entryFee = Number(feeText);
    const prizePool = poolText === '' ? 0 : Number(poolText);
    const maxTeams = Number(text(form.maxTeams).trim());

    if (!title) return { error: 'Title is required.' };
    if (!dates) return { error: 'Tournament dates are required.' };
    if (feeText === '' || Number.isNaN(entryFee) || entryFee < 0) return { error: 'Entry fee must be ৳0 or more.' };
    if (Number.isNaN(prizePool) || prizePool < 0) return { error: 'Prize pool must be ৳0 or more.' };
    if (!Number.isInteger(maxTeams) || maxTeams < 2) return { error: 'Max teams must be at least 2.' };
    if (bannerUrl && !HTTP_URL_RE.test(bannerUrl)) return { error: 'Banner must be an http(s) URL.' };
    if (editing && maxTeams < (editing.registeredCount || 0)) return { error: `Max teams cannot be below the ${editing.registeredCount} already registered.` };

    return {
        payload: {
            ...(editing ? { id: editing.id } : {}),
            title,
            edition: form.edition.trim() || undefined,
            category: form.category,
            format: form.format,
            dates,
            registrationDeadline: form.registrationDeadline || undefined,
            entryFee,
            prizePool,
            firstPrize: form.firstPrize.trim(),
            runnerUpPrize: form.runnerUpPrize.trim(),
            maxTeams,
            bannerUrl,
            highlights: linesToList(form.highlights),
            rules: linesToList(form.rules)
        }
    };
}
