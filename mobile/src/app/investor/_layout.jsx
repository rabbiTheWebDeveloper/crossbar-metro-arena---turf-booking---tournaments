import React, { useEffect, useMemo, useState } from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart3, Calendar, Receipt, CreditCard } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { InvestorContext } from '@/context/InvestorContext';
import { colors } from '@/theme';

function tabIcon(Icon) {
    return function TabIcon({ color, focused }) {
        return <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 1.9} />;
    };
}

/**
 * Investor (partner) portal: Overview · Bookings · Expenses · Payouts.
 * Investors are fixed to the partner record the server linked to their login; admins may switch.
 * Access is restricted by the Stack.Protected guard in the root layout.
 */
export default function InvestorLayout() {
    const { investors, myInvestorId, isAdmin } = useArena();
    const insets = useSafeAreaInsets();

    const [adminSelectedId, setAdminSelectedId] = useState('');
    useEffect(() => {
        if (!isAdmin) return;
        if (!adminSelectedId || !investors.some(i => i.id === adminSelectedId)) {
            setAdminSelectedId(investors[0]?.id || '');
        }
    }, [isAdmin, investors, adminSelectedId]);

    const selectedInvestorId = isAdmin ? adminSelectedId : (myInvestorId || '');
    const activeInvestor = useMemo(() => investors.find(i => i.id === selectedInvestorId) || null, [investors, selectedInvestorId]);
    const value = useMemo(() => ({
        activeInvestor,
        selectedInvestorId,
        setSelectedInvestorId: isAdmin ? setAdminSelectedId : () => { },
        canSwitch: isAdmin,
        isLinked: Boolean(activeInvestor)
    }), [activeInvestor, selectedInvestorId, isAdmin]);

    return (
        <InvestorContext.Provider value={value}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarHideOnKeyboard: true,
                    tabBarActiveTintColor: colors.brand,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
                    tabBarStyle: { backgroundColor: '#070b0f', borderTopColor: colors.border, borderTopWidth: 1, height: 58 + insets.bottom, paddingTop: 4 },
                    sceneStyle: { backgroundColor: colors.bg }
                }}
            >
                <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: tabIcon(BarChart3) }} />
                <Tabs.Screen name="bookings" options={{ title: 'Bookings', tabBarIcon: tabIcon(Calendar) }} />
                <Tabs.Screen name="expenses" options={{ title: 'Expenses', tabBarIcon: tabIcon(Receipt) }} />
                <Tabs.Screen name="payouts" options={{ title: 'Payouts', tabBarIcon: tabIcon(CreditCard) }} />
            </Tabs>
        </InvestorContext.Provider>
    );
}
