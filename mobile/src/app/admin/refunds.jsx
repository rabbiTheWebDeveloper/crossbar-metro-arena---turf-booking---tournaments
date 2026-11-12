import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Clock, CheckCircle2 } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { RefundClaimCard } from '@/features/admin/refunds/RefundClaimCard';
import { RefundLedgerRow } from '@/features/admin/refunds/RefundLedgerRow';
import { RefundSheet } from '@/features/admin/refunds/RefundSheet';
import { REFUND_STATUS_TONES, refundStatusLabel } from '@/features/admin/refunds/status';
import { AppText, Button, Card, Heading, Label, Loading, Row, StatCard, StatGrid } from '@/components/ui';
import { colors } from '@/theme';

const PAGE_SIZE = 30;
const STATUSES = ['pending', 'approved', 'completed', 'rejected'];

/** Refund queue (approve / reject / record the transfer) and the ledger of closed refunds. */
export default function AdminRefundsScreen() {
    const { refunds, isLoadingData, handleRecordRefund } = useArena();
    const [request, setRequest] = useState(null); // { refund, mode: 'complete' | 'reject' }
    const [busyId, setBusyId] = useState(null);
    const [ledgerCount, setLedgerCount] = useState(PAGE_SIZE);

    const counts = useMemo(() => refunds.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {}), [refunds]);
    const openRefunds = useMemo(() => refunds
        .filter(r => r.status === 'pending' || r.status === 'approved')
        .sort((a, b) => String(a.requestDate || '').localeCompare(String(b.requestDate || ''))), [refunds]);
    const closedRefunds = useMemo(() => refunds
        .filter(r => r.status === 'completed' || r.status === 'rejected')
        .sort((a, b) => String(b.refundedDate || b.requestDate || '').localeCompare(String(a.refundedDate || a.requestDate || ''))), [refunds]);

    const handleApprove = async (refund) => {
        if (busyId) return;
        setBusyId(refund.id);
        await handleRecordRefund(refund.id, refund.amount, refund.refundMethod || 'bkash', '', 'approved');
        setBusyId(null);
    };

    const ledgerRemaining = closedRefunds.length - ledgerCount;

    return (
        <AdminScreen title="Refunds" subtitle="Cancellations and refund claims">
            <View style={{ gap: 2 }}>
                <Heading level={3}>{'Refunds & cancellations management'}</Heading>
                <AppText size="sm" tone="muted">
                    Review advance refund claims created by cancellations, approve or reject them, and record the transaction once the money has been sent.
                </AppText>
            </View>

            <StatGrid>
                {STATUSES.map(s => <StatCard key={s} label={refundStatusLabel(s)} value={String(counts[s] || 0)} tone={REFUND_STATUS_TONES[s]} />)}
            </StatGrid>

            {/* Open queue */}
            <View style={{ gap: 10 }}>
                <Row gap={6}>
                    <Clock size={15} color={colors.warning} />
                    <Label tone="warning">{`Open refund claims (${openRefunds.length})`}</Label>
                </Row>
                {isLoadingData && refunds.length === 0 ? <Loading label="Loading refunds…" /> : openRefunds.length === 0 ? (
                    <Card>
                        <AppText size="sm" tone="muted">No open refunds. Every claim has been processed.</AppText>
                    </Card>
                ) : (
                    openRefunds.map(ref => (
                        <RefundClaimCard
                            key={ref.id}
                            refund={ref}
                            busy={busyId === ref.id}
                            onApprove={handleApprove}
                            onReject={(r) => setRequest({ refund: r, mode: 'reject' })}
                            onProcess={(r) => setRequest({ refund: r, mode: 'complete' })}
                        />
                    ))
                )}
            </View>

            {/* Ledger */}
            <Card style={{ gap: 8 }}>
                <Row gap={6}>
                    <CheckCircle2 size={15} color={colors.brand} />
                    <Label tone="default">{`Refund ledger (${closedRefunds.length})`}</Label>
                </Row>
                {closedRefunds.length === 0 ? <AppText size="sm" tone="dim">No completed or rejected refunds yet.</AppText> : (
                    <View>
                        {closedRefunds.slice(0, ledgerCount).map(ref => <RefundLedgerRow key={ref.id} refund={ref} />)}
                        {ledgerRemaining > 0 ? <Button title={`Show more (${ledgerRemaining} remaining)`} variant="secondary" size="sm" onPress={() => setLedgerCount(c => c + PAGE_SIZE)} style={{ marginTop: 8 }} /> : null}
                    </View>
                )}
            </Card>

            <RefundSheet request={request} onClose={() => setRequest(null)} />
        </AdminScreen>
    );
}
