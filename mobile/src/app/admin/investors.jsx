import React, { useMemo, useState } from 'react';
import { Plus, Percent, TrendingUp, HandCoins } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { AppText, Button, Card, Loading, MonthSwitcher, StatCard, StatGrid, confirm } from '@/components/ui';
import { todayDhakaIso } from '@/lib/dateUtils';
import { formatMoney, formatMonth } from '@/data/finance';
import { AdminScreen } from '@/features/admin/AdminScreen';
import { InvestorCard } from '@/features/admin/finance/InvestorCard';
import { AddInvestorSheet, MAX_PARTNERS } from '@/features/admin/finance/AddInvestorSheet';
import { PayoutSheet } from '@/features/admin/finance/PayoutSheet';
import { LinkLoginSheet } from '@/features/admin/finance/LinkLoginSheet';
import { EditShareSheet } from '@/features/admin/finance/EditShareSheet';
import { trimNumber } from '@/features/admin/finance/helpers';

/** Admin · Investors: equity partners, their monthly share and payouts, login links and status. */
export default function AdminInvestorsScreen() {
    const { investors, payouts, users, isLoadingData, calculateMonthlyFinance, handleUpdateInvestor, handleDeleteInvestor } = useArena();

    const [selectedMonth, setSelectedMonth] = useState(() => todayDhakaIso().slice(0, 7));
    const report = useMemo(() => calculateMonthlyFinance(selectedMonth), [calculateMonthlyFinance, selectedMonth]);
    const shares = useMemo(() => report.investorShares || [], [report]);
    const shareById = useMemo(() => Object.fromEntries(shares.map(s => [s.investor.id, s])), [shares]);

    const activeInvestors = useMemo(() => investors.filter(i => (i.status || 'active') === 'active'), [investors]);
    const totalInvestorPct = useMemo(() => activeInvestors.reduce((sum, inv) => sum + (Number(inv.sharePercentage) || 0), 0), [activeInvestors]);
    const availablePct = Math.max(0, 100 - totalInvestorPct);

    const lifetimePaidById = useMemo(() => {
        const map = {};
        payouts.forEach(p => { map[p.investorId] = (map[p.investorId] || 0) + (Number(p.amount) || 0); });
        return map;
    }, [payouts]);

    const [showAddSheet, setShowAddSheet] = useState(false);
    const [payoutInvestor, setPayoutInvestor] = useState(null);
    const [linkInvestor, setLinkInvestor] = useState(null);
    const [shareInvestor, setShareInvestor] = useState(null);
    const [busyId, setBusyId] = useState(null);

    const userLabel = (uid) => {
        const u = (users || []).find(x => x.id === uid);
        return u ? `${u.name} (${u.phone})` : '';
    };

    const handleToggleStatus = async (inv) => {
        const nextStatus = (inv.status || 'active') === 'active' ? 'inactive' : 'active';
        if (nextStatus === 'inactive') {
            const ok = await confirm(`Deactivate ${inv.name}?`, 'They will stop receiving a share of profit until reactivated.', { confirmText: 'Deactivate', destructive: true });
            if (!ok) return;
        }
        setBusyId(inv.id);
        await handleUpdateInvestor(inv.id, { status: nextStatus });
        setBusyId(null);
    };

    const handleDelete = async (inv) => {
        const ok = await confirm(`Delete ${inv.name}?`, 'If payouts exist the account is set to inactive instead.', { confirmText: 'Delete', destructive: true });
        if (!ok) return;
        setBusyId(inv.id);
        await handleDeleteInvestor(inv.id);
        setBusyId(null);
    };

    const paidTotal = shares.reduce((s, i) => s + i.paidAmount, 0);
    const owedTotal = shares.reduce((s, i) => s + i.balance, 0);

    return (
        <>
            <AdminScreen title="Investors" subtitle="Partners and payouts">
                <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />

                <StatGrid>
                    <StatCard
                        label="Active investor share"
                        value={`${trimNumber(totalInvestorPct)}%`}
                        hint={`Owners keep ${trimNumber(availablePct)}% · ${activeInvestors.length} active partner${activeInvestors.length === 1 ? '' : 's'}`}
                        icon={Percent}
                        tone="neutral"
                    />
                    <StatCard
                        label="Net profit"
                        value={formatMoney(report.netProfit)}
                        hint={`${formatMonth(selectedMonth)}${report.isLossMonth ? ' · no dividend' : ''}`}
                        icon={TrendingUp}
                        tone={report.isLossMonth ? 'danger' : 'brand'}
                    />
                    <StatCard
                        label="Partner share this month"
                        value={formatMoney(report.totalInvestorShare)}
                        hint={`paid ${formatMoney(paidTotal)} · owed ${formatMoney(owedTotal)}`}
                        icon={HandCoins}
                        tone="neutral"
                    />
                </StatGrid>

                {isLoadingData && investors.length === 0 ? <Loading label="Loading partners…" /> : null}

                {!isLoadingData && investors.length === 0 ? (
                    <Card>
                        <AppText size="sm" tone="muted">No partners yet. Add the first equity partner below.</AppText>
                    </Card>
                ) : null}

                {investors.map(inv => (
                    <InvestorCard
                        key={inv.id}
                        investor={inv}
                        share={shareById[inv.id]}
                        lifetimePaid={lifetimePaidById[inv.id] || 0}
                        loginLabel={inv.userId ? userLabel(inv.userId) : ''}
                        busy={busyId === inv.id}
                        onEditShare={() => setShareInvestor(inv)}
                        onLink={() => setLinkInvestor(inv)}
                        onToggleStatus={() => handleToggleStatus(inv)}
                        onDelete={() => handleDelete(inv)}
                        onPayout={() => setPayoutInvestor(inv)}
                    />
                ))}

                <Button title="Add investor" icon={Plus} size="lg" block disabled={investors.length >= MAX_PARTNERS} onPress={() => setShowAddSheet(true)} />
                {investors.length >= MAX_PARTNERS ? <AppText size="xs" tone="dim" center>{`Maximum ${MAX_PARTNERS} partners allowed.`}</AppText> : null}
            </AdminScreen>

            <AddInvestorSheet visible={showAddSheet} onClose={() => setShowAddSheet(false)} availablePct={availablePct} />
            <EditShareSheet investor={shareInvestor} onClose={() => setShareInvestor(null)} />
            <LinkLoginSheet investor={linkInvestor} onClose={() => setLinkInvestor(null)} />
            <PayoutSheet
                investor={payoutInvestor}
                share={payoutInvestor ? shareById[payoutInvestor.id] : undefined}
                month={selectedMonth}
                onClose={() => setPayoutInvestor(null)}
            />
        </>
    );
}
