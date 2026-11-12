import { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const COPIED_MS = 2500;

/**
 * Export actions for the lineup text.
 *   getText(): returns the formatted lineup at the moment of the action
 * Returns { copied, copyError, copy, shareWhatsApp, shareOther }.
 */
export function useLineupShare(getText) {
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState('');
    const timer = useRef(null);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    /** Copy the lineup to the clipboard; the "copied" flag clears itself after a moment. */
    const copy = useCallback(async () => {
        setCopyError('');
        try {
            await Clipboard.setStringAsync(getText());
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), COPIED_MS);
        } catch {
            setCopyError('Could not copy automatically. Use the WhatsApp button or share the lineup manually.');
        }
    }, [getText]);

    /** System share sheet (any messaging app). */
    const shareOther = useCallback(async () => {
        try {
            await Share.share({ message: getText() });
        } catch {
            setCopyError('Could not open the share sheet on this device. Copy the lineup text instead.');
        }
    }, [getText]);

    /** Open WhatsApp with the lineup prefilled: the app first, then the web link, then the share sheet. */
    const shareWhatsApp = useCallback(async () => {
        const encoded = encodeURIComponent(getText());
        try {
            await Linking.openURL(`whatsapp://send?text=${encoded}`);
        } catch {
            try {
                await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
            } catch {
                await shareOther();
            }
        }
    }, [getText, shareOther]);

    return { copied, copyError, copy, shareWhatsApp, shareOther };
}
