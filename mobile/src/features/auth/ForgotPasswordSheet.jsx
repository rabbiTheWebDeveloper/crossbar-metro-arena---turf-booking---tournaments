import React, { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { KeyRound, MessageSquare } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Button, AppText, Notice } from '@/components/ui';
import { FORGOT_PASSWORD_HELP } from './constants';
import { openLink, telUrl } from './links';

/** "Forgot your password?" help: passwords are reset by the arena desk (WhatsApp / phone). */
export function ForgotPasswordSheet({ visible, onClose }) {
    const { resetPasswordSMS, siteSettings } = useArena();
    const [message, setMessage] = useState('');
    const [linkError, setLinkError] = useState('');

    useEffect(() => {
        if (!visible) return undefined;
        let active = true;
        setLinkError('');
        resetPasswordSMS()
            .then(res => { if (active) setMessage(res?.message || ''); })
            .catch(() => { if (active) setMessage(''); });
        return () => { active = false; };
    }, [visible, resetPasswordSMS]);

    const phone = siteSettings?.phone || '';
    const whatsappUrl = siteSettings?.whatsappUrl || '';

    return (
        <Sheet visible={visible} onClose={onClose} title="Forgot your password?" icon={KeyRound}>
            <AppText size="sm" tone="soft">{message || FORGOT_PASSWORD_HELP}</AppText>
            {message ? <AppText size="xs" tone="muted">Message the arena desk from your registered number and the team will reset it for you.</AppText> : null}
            {linkError ? <Notice type="error" message={linkError} /> : null}
            {whatsappUrl ? (
                <Button
                    title="Message the arena desk"
                    icon={MessageSquare}
                    block
                    onPress={() => openLink(whatsappUrl, () => setLinkError('Could not open WhatsApp on this device.'))}
                />
            ) : null}
            {phone ? (
                <Pressable hitSlop={8} onPress={() => openLink(telUrl(phone), () => setLinkError('Could not open the phone dialer on this device.'))}>
                    <AppText size="sm" tone="muted" center>
                        or call <AppText size="sm" tone="brand" weight="800" mono>{siteSettings?.phoneFormatted || phone}</AppText>
                    </AppText>
                </Pressable>
            ) : null}
        </Sheet>
    );
}
