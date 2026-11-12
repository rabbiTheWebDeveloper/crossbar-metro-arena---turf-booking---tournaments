import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ArenaProvider, useArena } from '@/context/ArenaContext';
import { Toast } from '@/components/ui';
import { TicketPassModal } from '@/components/TicketPassModal';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => { /* already hidden */ });

function RootNavigator() {
    const { isAdmin, isInvestor, authChecked } = useArena();

    // Keep the splash until we know who is signed in (avoids a visitor -> member flash)
    useEffect(() => {
        if (authChecked) SplashScreen.hideAsync().catch(() => { });
    }, [authChecked]);
    useEffect(() => {
        const t = setTimeout(() => SplashScreen.hideAsync().catch(() => { }), 6000);
        return () => clearTimeout(t);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="payment" options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
                <Stack.Protected guard={isAdmin}>
                    <Stack.Screen name="admin" />
                </Stack.Protected>
                <Stack.Protected guard={isAdmin || isInvestor}>
                    <Stack.Screen name="investor" />
                </Stack.Protected>
            </Stack>
            <TicketPassModal />
            <Toast />
        </View>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="light" />
            <ArenaProvider>
                <RootNavigator />
            </ArenaProvider>
        </SafeAreaProvider>
    );
}
