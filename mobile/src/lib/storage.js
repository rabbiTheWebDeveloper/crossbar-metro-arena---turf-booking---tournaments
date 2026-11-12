/**
 * Small per-device persistence (AsyncStorage). The MongoDB-backed API is the single source of
 * truth for arena data; only conveniences live here: the cart, the last signed-in user (for an
 * instant first paint), cosmetic slot holds and the local notification log.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
    CART: 'cma_cart_v1',
    CURRENT_USER: 'cma_current_user_v3',
    SLOT_HOLDS: 'cma_slot_holds_v3',
    SMS_LOGS: 'cma_sms_logs_v3',
    SQUAD: 'cma_squad_builder_v1',
    PENDING_PAYMENT: 'cma_pending_payment_v1'
};

export async function readJson(key, fallback = null) {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (raw === null || raw === undefined) return fallback;
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch {
        return fallback;
    }
}

export async function writeJson(key, value) {
    try {
        if (value === null || value === undefined) await AsyncStorage.removeItem(key);
        else await AsyncStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

export const removeKey = (key) => writeJson(key, null);

// ---- Slot holds (cosmetic "someone is paying" marker on this device) ----
export function activeHolds(holds) {
    const now = Date.now();
    return (Array.isArray(holds) ? holds : []).filter(h => h && h.expiresAt > now);
}

export function makeHold(courtId, date, slotNumber, teamName, holdMinutes = 10) {
    const now = Date.now();
    return {
        id: `${date}_${slotNumber}`,
        slotKey: `${date}_${slotNumber}`,
        courtId, date, slotNumber, teamName,
        heldAt: now,
        expiresAt: now + holdMinutes * 60 * 1000
    };
}
