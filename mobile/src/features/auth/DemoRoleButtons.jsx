import React from 'react';
import { View } from 'react-native';
import { Zap, UserCheck, ShieldCheck, TrendingUp } from 'lucide-react-native';
import { AppText, Button, Row, Divider } from '@/components/ui';
import { colors } from '@/theme';

const DEMO_ROLES = [
    { role: 'player', label: 'Player', icon: UserCheck },
    { role: 'admin', label: 'Admin', icon: ShieldCheck },
    { role: 'investor', label: 'Investor', icon: TrendingUp }
];

/** One-tap demo sign-in (only rendered on demo builds: EXPO_PUBLIC_DEMO_MODE=true). */
export function DemoRoleButtons({ disabled, onPick }) {
    return (
        <View style={{ gap: 10 }}>
            <Divider style={{ marginVertical: 0 }} />
            <Row justify="space-between">
                <Row gap={6}>
                    <Zap size={14} color={colors.warning} />
                    <AppText size="xs" tone="muted" weight="800" upper>Demo profiles (demo mode only)</AppText>
                </Row>
                <AppText size="xs" tone="dim">Tap to sign in</AppText>
            </Row>
            <Row>
                {DEMO_ROLES.map(d => (
                    <Button key={d.role} title={d.label} icon={d.icon} variant="secondary" size="sm" upper={false} disabled={disabled} onPress={() => onPick(d.role)} style={{ flex: 1 }} />
                ))}
            </Row>
        </View>
    );
}
