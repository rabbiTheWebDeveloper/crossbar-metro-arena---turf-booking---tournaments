import { Investor } from '@/models/investor-model';
import { isObjectId, cleanPhone } from '@/lib/apiAuth';

/**
 * Resolve which Investor record belongs to a logged-in user: userId link first, exact phone second.
 * The caller must have connected to the database already.
 */
export async function findInvestorForUser(user) {
    if (!user) return null;
    const uid = user.userId || user.id;
    let inv = null;
    if (isObjectId(uid)) inv = await Investor.findOne({ userId: String(uid) });
    if (!inv && user.phone) {
        const phone = cleanPhone(user.phone);
        const all = await Investor.find({ phone: { $exists: true, $ne: '' } });
        inv = all.find(i => cleanPhone(i.phone) === phone) || null;
    }
    return inv;
}
