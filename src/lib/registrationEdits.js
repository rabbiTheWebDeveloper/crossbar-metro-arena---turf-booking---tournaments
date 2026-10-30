import { Tournament } from '@/models/Tournament';

// The admin UI historically used "verified"; the model stores "confirmed".
export const normalizeStatus = (s) => (s === 'verified' ? 'confirmed' : s);

export const toStringList = (value) => {
    if (Array.isArray(value)) return value.map(v => (typeof v === 'string' ? v : v?.name || '')).map(v => v.trim()).filter(Boolean);
    if (typeof value === 'string') return value.split('\n').map(v => v.trim()).filter(Boolean);
    return [];
};

export async function adjustRegisteredCount(tournamentId, prevStatus, nextStatus) {
    if (!tournamentId || prevStatus === nextStatus) return;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(tournamentId));
    if (!isObjectId) return;
    if (nextStatus === 'confirmed' && prevStatus !== 'confirmed') {
        await Tournament.findByIdAndUpdate(tournamentId, { $inc: { registeredCount: 1 } });
    } else if (prevStatus === 'confirmed' && nextStatus !== 'confirmed') {
        await Tournament.findByIdAndUpdate(tournamentId, { $inc: { registeredCount: -1 } });
    }
}

/** Apply admin-editable fields from a request body onto a registration document. */
export function applyRegistrationEdits(reg, body) {
    if (body.teamName !== undefined) reg.teamName = String(body.teamName).trim();
    if (body.captainName !== undefined) reg.captainName = String(body.captainName).trim();
    if (body.captainPhone !== undefined) reg.captainPhone = String(body.captainPhone).trim();
    if (body.captainEmail !== undefined) reg.captainEmail = String(body.captainEmail).trim().toLowerCase();
    if (body.jerseyColor !== undefined) reg.jerseyColor = String(body.jerseyColor).trim();
    if (body.tournamentTitle !== undefined) reg.tournamentTitle = String(body.tournamentTitle).trim();
    if (body.playersList !== undefined) {
        reg.playersList = toStringList(body.playersList);
        reg.playerCount = reg.playersList.length || reg.playerCount;
    }
    if (body.playerCount !== undefined && Number(body.playerCount) > 0) reg.playerCount = Number(body.playerCount);
    if (body.paymentMethod !== undefined) reg.paymentMethod = body.paymentMethod;
    if (body.transactionId !== undefined) reg.transactionId = String(body.transactionId).trim();
    if (body.amount !== undefined && !Number.isNaN(Number(body.amount))) reg.amount = Number(body.amount);
    if (body.notes !== undefined) reg.notes = String(body.notes).trim();
}
