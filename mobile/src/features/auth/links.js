import { Linking } from 'react-native';

/** "01796-337133" -> "tel:01796337133" */
export const telUrl = (phone) => `tel:${String(phone || '').replace(/[^0-9+]/g, '')}`;

/** Opens an external URL (dialer, WhatsApp, browser). `onFail` runs when the device cannot handle it. */
export function openLink(url, onFail) {
    if (!url) {
        if (onFail) onFail();
        return;
    }
    Linking.openURL(url).catch(() => { if (onFail) onFail(); });
}
