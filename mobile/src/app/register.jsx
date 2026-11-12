import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, Lock, ArrowRight, Trophy } from 'lucide-react-native';
import { useArena, cleanPhone } from '@/context/ArenaContext';
import { Screen, Card, Field, Input, Checkbox, Button, Notice, AppText, Row } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatNumber } from '@/lib/format';
import { AuthHeader, AuthFooter } from '@/features/auth/AuthBrand';
import { useAuthRedirect } from '@/features/auth/useAuthRedirect';
import { PHONE_RE, SIGNUP_POSITIONS } from '@/features/auth/constants';

/** Player sign-up. Public registration always creates a player account. */
export default function RegisterScreen() {
    const router = useRouter();
    const { signup, pricing } = useArena();
    const finishAuth = useAuthRedirect();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [position, setPosition] = useState('MID');
    const [agreeTerms, setAgreeTerms] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setError('');
        setSuccess('');
        if (!name.trim() || name.trim().length < 2) {
            setError('Please enter your full name (minimum 2 characters).');
            return;
        }
        const digits = cleanPhone(phone);
        if (!PHONE_RE.test(digits)) {
            setError('Please enter a valid 11-digit Bangladeshi mobile number starting with 01.');
            return;
        }
        if (!password || password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match. Please re-check.');
            return;
        }
        if (!agreeTerms) {
            setError('Please accept the arena turf rules and fair play pledge to continue.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await signup({ name: name.trim(), phone: digits, password, playingPosition: position });
            if (res.success) {
                setSuccess(res.message || 'Player profile created. Welcome to Crossbar Metro Arena!');
                finishAuth(res.user);
            } else {
                setError(res.message || 'Registration failed. Please try again.');
            }
        } catch {
            setError('Something went wrong while creating your account. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Screen back title="Create account" refreshable={false}>
            <AuthHeader
                icon={Trophy}
                eyebrow="JOIN CROSSBAR METRO ARENA"
                title="Create Player Profile"
                description="Book 90-minute floodlit slots, enter tournaments, and track your match stats in Dhaka."
            />

            <Card tone="brand" style={{ gap: spacing.md }}>
                {error ? <Notice type="error" message={error} /> : null}
                {success ? <Notice type="success" message={success} /> : null}

                <Input
                    label="Full Name"
                    icon={User}
                    placeholder="Your full name"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    maxLength={60}
                    returnKeyType="next"
                />
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

                <Field label="Playing Position" hint="Shown on squad cards">
                    <Row gap={8} accessibilityRole="radiogroup">
                        {SIGNUP_POSITIONS.map(pos => {
                            const selected = position === pos.id;
                            return (
                                <Pressable
                                    key={pos.id}
                                    onPress={() => setPosition(pos.id)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected }}
                                    accessibilityLabel={pos.desc}
                                    style={[styles.position, selected ? styles.positionActive : null]}
                                >
                                    <AppText size="sm" weight="900" mono style={{ color: selected ? colors.onBrand : colors.textSoft }}>{pos.label}</AppText>
                                    <AppText size="xxs" style={{ color: selected ? colors.onBrand : colors.textMuted }} numberOfLines={1}>{pos.desc}</AppText>
                                </Pressable>
                            );
                        })}
                    </Row>
                </Field>

                <Input
                    label="Password"
                    icon={Lock}
                    secure
                    placeholder="Min 6 characters"
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="new-password"
                    returnKeyType="next"
                />
                <Input
                    label="Confirm Password"
                    icon={Lock}
                    secure
                    placeholder="Re-enter"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="new-password"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                />

                <Checkbox
                    checked={agreeTerms}
                    onChange={setAgreeTerms}
                    label={`I agree to the Crossbar Metro Arena turf rules, fair play pledge and the ৳${formatNumber(pricing?.advanceAmount || 0)} advance booking policy.`}
                />

                <Button
                    title={isSubmitting ? 'Creating your profile...' : 'Create Player Account'}
                    iconRight={ArrowRight}
                    size="lg"
                    block
                    loading={isSubmitting}
                    onPress={handleSubmit}
                />
            </Card>

            <Row justify="center" gap={6} wrap>
                <AppText size="sm" tone="muted">Already have an arena account?</AppText>
                <Pressable onPress={() => router.replace('/login')} hitSlop={8} accessibilityRole="link">
                    <AppText size="sm" tone="brand" weight="800">Sign in →</AppText>
                </Pressable>
            </Row>

            <AuthFooter />
        </Screen>
    );
}

const styles = StyleSheet.create({
    position: { flex: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 2, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input },
    positionActive: { backgroundColor: colors.brand, borderColor: colors.brand }
});
