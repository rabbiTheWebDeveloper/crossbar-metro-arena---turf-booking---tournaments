import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Trophy, Calendar, ShoppingBag, User } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { colors } from '@/theme';

const TAB_BG = '#070b0f';

function tabIcon(Icon) {
    return function TabIcon({ color, focused }) {
        return <Icon size={21} color={color} strokeWidth={focused ? 2.4 : 1.9} />;
    };
}

function BookTabIcon() {
    return (
        <View style={{ width: 46, height: 46, borderRadius: 23, marginTop: -18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: TAB_BG, elevation: 6, shadowColor: colors.brand, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
            <Calendar size={20} color={colors.onBrand} strokeWidth={2.6} />
        </View>
    );
}

/** Bottom navigation: Home · Match Day · Book (raised) · Shop · Me — same as the mobile website. */
export default function TabsLayout() {
    const { isVisitor, cartCount } = useArena();
    const insets = useSafeAreaInsets();
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: colors.brand,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
                tabBarStyle: { backgroundColor: TAB_BG, borderTopColor: colors.border, borderTopWidth: 1, height: 58 + insets.bottom, paddingTop: 4 },
                sceneStyle: { backgroundColor: colors.bg }
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon(Home) }} />
            <Tabs.Screen name="results" options={{ title: 'Match Day', tabBarIcon: tabIcon(Trophy) }} />
            <Tabs.Screen name="booking" options={{ title: 'Book', tabBarLabelStyle: { fontSize: 11, fontWeight: '900', color: colors.brand }, tabBarIcon: BookTabIcon }} />
            <Tabs.Screen
                name="shop"
                options={{
                    title: 'Shop',
                    tabBarIcon: tabIcon(ShoppingBag),
                    tabBarBadge: cartCount > 0 ? cartCount : undefined,
                    tabBarBadgeStyle: { backgroundColor: colors.brand, color: colors.onBrand, fontSize: 10, fontWeight: '900' }
                }}
            />
            <Tabs.Screen name="me" options={{ title: isVisitor ? 'Login' : 'Me', tabBarIcon: tabIcon(User) }} />
        </Tabs>
    );
}
