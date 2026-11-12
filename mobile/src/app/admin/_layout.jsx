import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme';

/**
 * Arena Desk (admin portal). Access is restricted to admins by the Stack.Protected guard in the
 * root layout; every API call is also authorised on the server.
 */
export default function AdminLayout() {
    return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }} />;
}
