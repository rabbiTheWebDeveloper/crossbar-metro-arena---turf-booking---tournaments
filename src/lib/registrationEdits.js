import { Tournament } from '@/models/Tournament';
import { OtherIncome } from '@/models/OtherIncome';

// The admin UI historically used "verified"; the model stores "confirmed".
export const normalizeStatus = (s) => (s === 'verified' ? 'confirmed' : s);

export const toStringList = (value) => {
    if (Array.isArray(value)) return value.map(v => (typeof v === 'string' ? v : v?.name || '')).map(v => v.trim()).filter(Boolean);
    if (typeof value === 'string') return value.split('\n').map(v => v.trim()).filter(Boolean);
    return [];
};

export async function adjustRegisteredCount(tournamentId, prevStatus, nextStatus, reg = null) {
    if (!tournamentId || prevStatus === nextStatus) return;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(tournamentId));
    if (!isObjectId) return;
    if (nextStatus === 'confirmed' && prevStatus !== 'confirmed') {
        await Tournament.findByIdAndUpdate(tournamentId, { $inc: { registeredCount: 1 } });
        // Entry fee becomes income once the squad is confirmed (recorded once per registration)
        if (reg && Number(reg.amount) > 0) {
            const title = `Entry fee: ${reg.teamName} · ${reg.tournamentTitle} (${reg._id})`;
            const exists = await OtherIncome.findOne({ title });
            if (!exists) await OtherIncome.create({ source: 'event_fees', title, amount: Number(reg.amount), date: new Date().toISOString().split('T')[0], notes: `${reg.paymentMethod || ''} ${reg.transactionId || ''}`.trim(), recordedBy: 'Registrations' });
        }
    } else if (prevStatus === 'confirmed' && nextStatus !== 'confirmed') {
        await Tournament.findByIdAndUpdate(tournamentId, { $inc: { registeredCount: -1 } });
        if (reg) await OtherIncome.deleteOne({ title: `Entry fee: ${reg.teamName} · ${reg.tournamentTitle} (${reg._id})` }).catch(() => { });
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
