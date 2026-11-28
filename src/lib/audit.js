/**
 * Shared audit-trail schema fields and stamp helpers for every Mongoose model & API route.
 * Tracks `userId`, `createdBy`, `updatedBy` (plus `createdById` and `updatedById` actor ObjectIds).
 */

export const AUDIT_ONLY_FIELDS = {
    createdBy: { type: String, trim: true, default: '' },
    updatedBy: { type: String, trim: true, default: '' },
    createdById: { type: String, trim: true, default: '', index: true },
    updatedById: { type: String, trim: true, default: '', index: true }
};

export const AUDIT_SCHEMA_FIELDS = {
    userId: { type: String, trim: true, default: '', index: true },
    ...AUDIT_ONLY_FIELDS
};

/** Extract the stringified MongoDB ObjectId of the acting user (or '' for anonymous/system). */
export function actorId(user) {
    if (!user) return '';
    const raw = user.userId || user.id || user._id || '';
    return String(raw || '').trim();
}

/** Human-readable actor label for `createdBy` / `updatedBy` (e.g. "S M AL RABBI (Admin)" or "Tanvir (Front Desk)"). */
export function actorLabel(user, fallback = 'System') {
    if (!user) return fallback;
    if (typeof user === 'string') return user.trim() || fallback;
    const name = String(user.name || '').trim();
    if (!name) return fallback;
    if (user.role === 'admin') return `${name} (Admin)`;
    if (user.role === 'staff') {
        const roleName = String(user.staffRoleName || '').trim();
        return roleName ? `${name} (${roleName})` : `${name} (Staff)`;
    }
    return name;
}

/**
 * Build `{ userId, createdBy, updatedBy, createdById, updatedById }` when creating a new document.
 * Pass `userId` explicitly when the document's `userId` represents a target customer/account rather than the actor.
 */
export function stampCreate(user, { fallback = 'System', userId } = {}) {
    const id = actorId(user);
    const label = actorLabel(user, fallback);
    return {
        userId: userId !== undefined ? String(userId || '').trim() : id,
        createdBy: label,
        updatedBy: label,
        createdById: id,
        updatedById: id
    };
}

/**
 * Build `{ createdBy, updatedBy, createdById, updatedById }` without touching `userId`
 * (used on models like Customer, Investor, and EmailOtp where `userId` has domain-specific meaning).
 */
export function stampCreateAuditOnly(user, fallback = 'System') {
    const id = actorId(user);
    const label = actorLabel(user, fallback);
    return {
        createdBy: label,
        updatedBy: label,
        createdById: id,
        updatedById: id
    };
}

/** Build `$set`-ready update fields `{ updatedBy, updatedById, ...(optional userId backfill) }`. */
export function stampUpdate(user, { fallback = 'System', backfillUserId = false, currentUserId = '' } = {}) {
    const id = actorId(user);
    const label = actorLabel(user, fallback);
    const patch = {
        updatedBy: label,
        updatedById: id
    };
    if (backfillUserId && !String(currentUserId || '').trim() && id) {
        patch.userId = id;
    }
    return patch;
}

/** Mutate a Mongoose document in place before `.save()` to record who updated it. */
export function applyUpdateAudit(doc, user, { fallback = 'System', backfillUserId = false } = {}) {
    if (!doc) return doc;
    const id = actorId(user);
    const label = actorLabel(user, fallback);
    doc.updatedBy = label;
    if (id) doc.updatedById = id;
    if (!doc.createdBy) {
        doc.createdBy = doc.recordedBy || doc.postedBy || doc.sentBy || label;
    }
    if (!doc.createdById && id && !doc.createdAt) {
        doc.createdById = id;
    }
    if (backfillUserId && !doc.userId && id) {
        doc.userId = id;
    }
    return doc;
}

/** Extract normalized display values `{ createdBy, updatedBy, userId }` from any serialized model document. */
export function resolveAuditMeta(record) {
    if (!record || typeof record !== 'object') {
        return { createdBy: '', updatedBy: '', userId: '' };
    }
    const createdBy = String(
        record.createdBy || record.recordedBy || record.postedBy || record.sentBy || ''
    ).trim();
    const updatedBy = String(record.updatedBy || '').trim();
    const userId = String(
        record.userId || record.createdById || record.updatedById || ''
    ).trim();
    return { createdBy, updatedBy, userId };
}
