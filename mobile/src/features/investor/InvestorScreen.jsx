import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePortalNav } from '@/lib/navigation';
import { ChevronDown, UserX, LogIn, ShieldCheck, LogOut, Globe, MoreVertical } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { useInvestor } from '@/context/InvestorContext';
import { Screen, Sheet, IconButton, AppText, Badge, Row, Card, Heading, Button, Loading, ListItem, confirm } from '@/components/ui';
import { colors, radius } from '@/theme';

/** Partner picker (admins only): choose whose dashboard to view. */
function PartnerSwitcher() {
    const { investors } = useArena();
    const { activeInvestor, selectedInvestorId, setSelectedInvestorId, canSwitch } = useInvestor();
    const [open, setOpen] = useState(false);
    if (!activeInvestor) return null;
    if (!canSwitch) return <Badge tone="brand" label={`${activeInvestor.sharePercentage ?? 0}%`} />;
    return (
        <>
            <Pressable onPress={() => setOpen(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand }} accessibilityLabel="View as partner">
                <AppText size="xs" tone="brand" weight="800" numberOfLines={1} style={{ maxWidth: 110 }}>{`${activeInvestor.name} (${activeInvestor.sharePercentage ?? 0}%)`}</AppText>
                <ChevronDown size={13} color={colors.brand} />
            </Pressable>
            <Sheet visible={open} onClose={() => setOpen(false)} title="View as partner" subtitle="Admins can open any partner's dashboard">
                {investors.map(inv => (
                    <ListItem
                        key={inv.id}
                        title={`${inv.name} (${inv.sharePercentage}%)`}
                        subtitle={inv.status === 'inactive' ? 'Inactive partner' : (inv.phone || undefined)}
                        right={inv.id === selectedInvestorId ? <Badge tone="brand" label="Viewing" /> : null}
                        onPress={() => { setSelectedInvestorId(inv.id); setOpen(false); }}
                        chevron={false}
                    />
                ))}
            </Sheet>
        </>
    );
}

/** Account menu of the investor portal. */
function InvestorMenu({ visible, onClose }) {
    const openSection = usePortalNav('/investor');
    const { isAdmin, logout, currentUser } = useArena();
    const go = (href) => { onClose(); openSection(href); };
    const handleLogout = async () => {
        const ok = await confirm('Log out?', 'You will need to sign in again to view the investor portal.', { confirmText: 'Log out', destructive: true });
        if (!ok) return;
        onClose();
        openSection('/');
        await logout();
    };
    return (
        <Sheet visible={visible} onClose={onClose} title="Investor portal" subtitle={currentUser?.name ? `Signed in as ${currentUser.name}` : undefined}>
            <ListItem icon={Globe} title="Public app" subtitle="Back to the player-facing home" onPress={() => go('/')} />
            {isAdmin ? <ListItem icon={ShieldCheck} title="Admin console" subtitle="Open the Arena Desk" onPress={() => go('/admin')} /> : null}
            <ListItem icon={LogOut} iconTone={colors.danger} title="Log out" onPress={handleLogout} chevron={false} />
        </Sheet>
    );
}

/**
 * Shell for every investor screen. Shows the right gate when the portal cannot be displayed
 * (signed out / still loading / no partner record linked), otherwise renders the children.
 * Accepts all <Screen> props.
 */
export function InvestorScreen({ title, subtitle, children, right, ...screenProps }) {
    const router = useRouter();
    const { isVisitor, isAdmin, authChecked, isLoadingData, promptLogin, currentUser } = useArena();
    const { isLinked } = useInvestor();
    const [menuOpen, setMenuOpen] = useState(false);
    const stillResolving = !authChecked || (isLoadingData && !isLinked);

    let body = children;
    if (isVisitor && authChecked) {
        body = (
            <Card style={{ alignItems: 'center', gap: 12 }}>
                <LogIn size={30} color={colors.brand} />
                <Heading level={4} center upper>Partner sign-in required</Heading>
                <AppText size="sm" tone="muted" center>Log in with the account linked to your partner record to view the investor portal.</AppText>
                <Button title="Log in" onPress={() => promptLogin('login')} />
            </Card>
        );
    } else if (stillResolving) {
        body = <Loading label="Loading partner data…" />;
    } else if (!isLinked) {
        body = (
            <Card tone="warning" style={{ alignItems: 'center', gap: 12 }}>
                <UserX size={30} color={colors.warning} />
                <Heading level={4} center upper>No partner account linked</Heading>
                <AppText size="sm" tone="muted" center>
                    {isAdmin
                        ? 'There are no partner records yet. Add one from the Admin Console under Investors.'
                        : 'No partner account is linked to your login — contact the arena desk and they will link your partner record to this phone number.'}
                </AppText>
                {isAdmin ? <Button title="Manage investors" onPress={() => router.navigate('/admin/investors')} /> : null}
            </Card>
        );
    }

    return (
        <>
            <Screen
                tab
                title={title}
                subtitle={subtitle || `${String(currentUser?.role || 'investor').toUpperCase()} · confidential`}
                right={(
                    <Row gap={8}>
                        {right}
                        <PartnerSwitcher />
                        <IconButton icon={MoreVertical} onPress={() => setMenuOpen(true)} accessibilityLabel="Portal menu" />
                    </Row>
                )}
                {...screenProps}
            >
                <View style={{ gap: 16 }}>{body}</View>
            </Screen>
            <InvestorMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
        </>
    );
}
