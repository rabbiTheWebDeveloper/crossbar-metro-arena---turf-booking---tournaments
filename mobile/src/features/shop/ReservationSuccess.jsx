import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { AppText, Heading, Label, Mono } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { formatIsoDate, isIsoDate } from '@/lib/dateUtils';
import { colors, radius, spacing } from '@/theme';
import { reservationTotal } from './shopUtils';

/**
 * Confirmation block shown after a pickup reservation is saved: the code to show at reception.
 *   reservation: the object returned by the API
 *   title / message: copy for the context (single product vs whole bag)
 *   showTotal: also print the amount payable at the counter
 *   showPickupDate: also print the chosen pickup date
 */
export function ReservationSuccess({ reservation, title, message, showTotal, showPickupDate, children }) {
    if (!reservation) return null;
    const total = reservationTotal(reservation);
    return (
        <View style={styles.box}>
            <View style={styles.icon}>
                <CheckCircle2 size={28} color={colors.brand} />
            </View>
            <Heading level={3} center upper>{title}</Heading>
            <AppText size="sm" tone="soft" center>{message}</AppText>
            <View style={styles.code}>
                <Label>Pickup Pass Code</Label>
                <Mono size="xxl" tone="brand" weight="900" selectable>{String(reservation.reservationCode || '')}</Mono>
                {showTotal && total > 0 ? <AppText size="sm" weight="800">{`Total payable: ${formatMoney(total)}`}</AppText> : null}
                {showPickupDate && isIsoDate(reservation.pickupDate) ? <AppText size="xs" tone="muted">{`Pickup date: ${formatIsoDate(reservation.pickupDate)}`}</AppText> : null}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    box: { alignItems: 'center', gap: spacing.md, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.brandSoft },
    icon: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.brand, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
    code: { alignSelf: 'stretch', alignItems: 'center', gap: 4, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderBrand, backgroundColor: colors.input }
});
