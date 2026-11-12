import React from 'react';
import { Phone, MessageCircle } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Row, Button } from '@/components/ui';
import { isFullPhone, telLink, whatsappLink, openLink } from './matchdayUtils';

/**
 * "Call" + "WhatsApp" buttons for a captain's number. Renders nothing when the number is
 * missing or masked (public challenge listings hide the middle digits).
 *   phone: raw phone string        message: optional WhatsApp prefilled text
 */
export function ContactButtons({ phone, message, size = 'sm', style }) {
    const { showNotice } = useArena();
    if (!isFullPhone(phone)) return null;
    return (
        <Row wrap style={style}>
            <Button
                title="Call"
                icon={Phone}
                variant="secondary"
                size={size}
                onPress={() => openLink(telLink(phone), () => showNotice('error', 'Could not open the phone dialler on this device.'))}
            />
            <Button
                title="WhatsApp"
                icon={MessageCircle}
                variant="outline"
                size={size}
                onPress={() => openLink(whatsappLink(phone, message), () => showNotice('error', 'Could not open WhatsApp on this device.'))}
            />
        </Row>
    );
}
