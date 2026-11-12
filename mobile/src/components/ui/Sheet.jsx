import React from 'react';
import { Modal, View, ScrollView, Pressable, KeyboardAvoidingView, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText, Heading } from './Typography';
import { Toast } from './Feedback';

/**
 * Bottom sheet modal: the app's replacement for the website's modals and drawers.
 *   visible / onClose
 *   title / subtitle / icon (lucide component)
 *   footer: node pinned under the scroll area (action buttons)
 *   scroll: wrap children in a ScrollView (default true)
 *   full: use (almost) the whole screen height
 *   dismissable: allow closing by tapping the backdrop / back button (default true)
 */
export function Sheet({ visible, onClose, title, subtitle, icon: Icon, footer, children, scroll = true, full = false, dismissable = true, contentStyle }) {
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const maxHeight = Math.round(height * (full ? 0.94 : 0.88));
    const close = () => { if (dismissable && onClose) onClose(); };

    return (
        <Modal visible={!!visible} transparent animationType="slide" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
            <KeyboardAvoidingView behavior="padding" style={styles.root}>
                <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
                <View style={[styles.sheet, { maxHeight, paddingBottom: Math.max(insets.bottom, spacing.md) }, full ? { height: maxHeight } : null]}>
                    <View style={styles.grabber} />
                    {(title || onClose) ? (
                        <View style={styles.header}>
                            {Icon ? (
                                <View style={styles.headerIcon}>
                                    <Icon size={18} color={colors.brand} />
                                </View>
                            ) : null}
                            <View style={{ flex: 1 }}>
                                {title ? <Heading level={3} numberOfLines={2}>{title}</Heading> : null}
                                {subtitle ? <AppText size="xs" tone="muted">{subtitle}</AppText> : null}
                            </View>
                            {onClose ? (
                                <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
                                    <X size={18} color={colors.textMuted} />
                                </Pressable>
                            ) : null}
                        </View>
                    ) : null}
                    {scroll ? (
                        <ScrollView
                            style={{ flexShrink: 1 }}
                            contentContainerStyle={[{ padding: spacing.lg, gap: spacing.md }, contentStyle]}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {children}
                        </ScrollView>
                    ) : (
                        <View style={[{ flexShrink: 1, padding: spacing.lg, gap: spacing.md }, full ? { flex: 1 } : null, contentStyle]}>{children}</View>
                    )}
                    {footer ? <View style={styles.footer}>{footer}</View> : null}
                </View>
                {/* A modal covers the root layout, so notices fired while it is open are shown here too */}
                <Toast />
            </KeyboardAvoidingView>
        </Modal>
    );
}

/**
 * Promise-based confirmation dialog (native alert).
 *   const ok = await confirm('Cancel booking?', 'This cannot be undone.', { confirmText: 'Cancel booking', destructive: true });
 */
export function confirm(title, message, { confirmText = 'Confirm', cancelText = 'Cancel', destructive = false } = {}) {
    return new Promise((resolve) => {
        Alert.alert(title, message || undefined, [
            { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
            { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) }
        ], { cancelable: true, onDismiss: () => resolve(false) });
    });
}

/** Simple informational alert. */
export function alertMessage(title, message) {
    Alert.alert(title, message || undefined);
}

const styles = StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.borderStrong, overflow: 'hidden' },
    grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, marginTop: 8 },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    close: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.glassStrong, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm }
});
