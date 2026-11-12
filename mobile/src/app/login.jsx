import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Lock, ArrowRight, Sparkles } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { Screen, Card, Input, Button, Notice, AppText, Row } from '@/components/ui';
import { fonts, spacing } from '@/theme';
import { AuthHeader, AuthFooter } from '@/features/auth/AuthBrand';
import { ForgotPasswordSheet } from '@/features/auth/ForgotPasswordSheet';
import { DemoRoleButtons } from '@/features/auth/DemoRoleButtons';
import { useAuthRedirect } from '@/features/auth/useAuthRedirect';
import { PHONE_RE } from '@/features/auth/constants';

/** Member sign-in with a Bangladeshi mobile number and password. */
export default function LoginScreen() {
    const router = useRouter();
    const { login, demoMode, switchDemoUser } = useArena();
    const finishAuth = useAuthRedirect();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForgotHelp, setShowForgotHelp] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setError('');
        setSuccess('');
        const digits = cleanPhone(phone);
        if (!PHONE_RE.test(digits)) {
            setError('Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01XXXXXXXXX).');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await login(digits, password);
            if (res.success) {
                setSuccess(res.message || 'Signed in. Taking you to your dashboard...');
                finishAuth(res.user);
            } else {
                setError(res.message || 'Sign in failed. Please check your number and password.');
            }
        } catch {
            setError('Something went wrong while signing in. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDemo = async (role) => {
        if (isSubmitting) return;
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        try {
            const res = await switchDemoUser(role);
            if (res?.success) finishAuth(res.user || { role });
            else setError(res?.message || 'Demo sign-in failed.');
        } catch {
            setError('Demo sign-in failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen back title="Sign in" refreshable={false}>
            <AuthHeader
                icon={Sparkles}
                eyebrow="CROSSBAR MEMBER ACCESS"
                title="Welcome to the Pitch"
                description="Enter your mobile number and password to access your turf bookings & arena dashboard."
            />

            <Card tone="brand" style={{ gap: spacing.md }}>
                {error ? <Notice type="error" message={error} /> : null}
                {success ? <Notice type="success" message={success} /> : null}

                <Input
                    label="Mobile Number"
                    hint="Bangladesh (+880)"
                    icon={Phone}
                    type="phone"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChangeText={setPhone}
                    maxLength={16}
                    autoComplete="tel"
                    returnKeyType="next"
                    inputStyle={{ fontFamily: fonts.mono }}
                />
                <Input
                    label="Password"
                    icon={Lock}
                    secure
                    placeholder="Your password"
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                />
                <Pressable onPress={() => setShowForgotHelp(true)} hitSlop={8} style={{ alignSelf: 'flex-end' }} accessibilityRole="button">
                    <AppText size="sm" tone="brand" weight="700">Forgot password?</AppText>
                </Pressable>

                <Button
                    title={isSubmitting ? 'Signing in...' : 'Sign In & Enter Arena'}
                    iconRight={ArrowRight}
                    size="lg"
                    block
                    loading={isSubmitting}
                    onPress={handleSubmit}
                />

                {demoMode ? <DemoRoleButtons disabled={isSubmitting} onPick={handleDemo} /> : null}
            </Card>

            <Row justify="center" gap={6} wrap>
                <AppText size="sm" tone="muted">Don't have a Crossbar account yet?</AppText>
                <Pressable onPress={() => router.replace('/register')} hitSlop={8} accessibilityRole="link">
                    <AppText size="sm" tone="brand" weight="800">Register now →</AppText>
                </Pressable>
            </Row>

            <AuthFooter />

            <ForgotPasswordSheet visible={showForgotHelp} onClose={() => setShowForgotHelp(false)} />
        </Screen>
    );
}
