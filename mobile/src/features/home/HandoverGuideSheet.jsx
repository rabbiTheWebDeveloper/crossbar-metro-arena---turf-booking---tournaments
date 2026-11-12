import React, { useState } from 'react';
import { View } from 'react-native';
import { BookOpen, DollarSign, Calendar, Users, ShieldCheck, TrendingUp, Download } from 'lucide-react-native';
import { Sheet, Segmented, AppText, Heading, Mono, Button, Row } from '@/components/ui';
import { spacing } from '@/theme';

/** The six chapters of the owners' operating manual (same text as the website's handover guide). */
const TOPICS = [
    {
        id: 'walkin',
        label: '1. Walk-In Bookings',
        icon: Calendar,
        title: 'How to Add a Walk-In Booking',
        intro: 'When a team arrives at the arena counter without an online reservation:',
        steps: [
            { text: 'Go to Admin Portal → Schedule tab or click on any available slot in the schedule.' },
            { text: 'Pick the day and click "Walk-in Booking" on the free slot.' },
            { text: 'Enter the squad name, captain\'s name, and their mobile number.' },
            { text: 'Enter the price and payment received (Cash, bKash counter QR, Nagad, or Card POS). You can record full clearance or ৳500 advance.' },
            { text: 'Click "Confirm Walk-In Booking". The slot is locked instantly, guaranteed by database uniqueness rule.' },
            { text: 'If the team pays the rest when match finishes, click "Collect Balance" to record the final cash settlement.' }
        ]
    },
    {
        id: 'expenses',
        label: '2. Enter Expenses',
        icon: DollarSign,
        title: 'How to Enter Operational Expenses',
        intro: 'To keep the monthly net profit figure 100% accurate for investors and tax compliance:',
        steps: [
            { text: 'Go to Admin Portal → Expenses tab.' },
            { text: 'Click "Record Expense".' },
            { text: 'Select the expense category: Electricity, Staff Salary, Rent, Turf Maintenance, Water, Internet, Marketing, Equipment, Shop Stock, or Other.' },
            { text: 'Enter the exact amount in Taka (৳), invoice date, and receipt number / memo note.' },
            { text: 'Click "Save Expense Entry".' },
            { text: 'The expense immediately updates this month\'s net profit in the investor and owner dashboards.' }
        ]
    },
    {
        id: 'report',
        label: '3. 1-Click Monthly Report',
        icon: TrendingUp,
        title: 'How to Run the 1-Click Monthly Financial Report',
        intro: 'Every 1st of the month, generate the certified revenue statement:',
        steps: [
            { text: 'Go to Admin Portal → Financial Report.' },
            { text: 'Select the month from the dropdown (e.g. October 2026).' },
            {
                text: 'The system computes:',
                bullets: [
                    'Booking money collected: All online and cash payments minus refunds paid.',
                    'Other income: Shop sales, tournament fees, sponsorship.',
                    'Total expenses: Sum of all expense receipts for the chosen month.',
                    'Net Profit = Total Revenue − Expenses.',
                    'Investor Shares: Each investor\'s exact dividend (Net Profit × Share %). If loss, ৳0.'
                ]
            },
            { text: 'Click "Export CSV / Excel" to download the spreadsheet or click "Print Report" for a formal printable audit statement.' }
        ]
    },
    {
        id: 'payouts',
        label: '4. Investor Payouts',
        icon: Users,
        title: 'How to Record Monthly Investor Payouts',
        intro: 'Once profits are disbursed to partners:',
        steps: [
            { text: 'Go to Admin Portal → Investors tab.' },
            { text: 'Verify each investor\'s calculated share from the financial report.' },
            { text: 'After sending funds via Bank Transfer, bKash, or cheque, click "Record Payout" under their profile.' },
            { text: 'Enter the amount paid, payment method, bank transaction reference number, and date.' },
            { text: 'Click "Log Payout". The payout instantly appears in that investor\'s private My Payouts tab on their investor portal.' }
        ]
    },
    {
        id: 'pricing',
        label: '5. 24 Slot Pricing Matrix',
        icon: ShieldCheck,
        title: 'How to Edit the 24 Slot Pricing Matrix',
        intro: 'Crossbar Metro Arena operates 12 fixed slots daily with individual weekday and weekend pricing:',
        steps: [
            { text: 'Go to Admin Portal → Slot Pricing & Rules.' },
            { text: 'Each of the 12 slots has its own Weekday Price (Sun–Thu) and Weekend Price (Fri–Sat).' },
            { text: 'Edit any slot\'s price directly. You can set prime evening floodlight slots higher and morning slots lower.' },
            { text: 'You can also configure the Advance Amount (default ৳500), Hold Window (10 mins), and Cancellation Hours (24h).' },
            { text: 'Click "Save Pricing & Rules". Existing bookings are preserved; new bookings immediately reflect the updated prices.' }
        ]
    },
    {
        id: 'backup',
        label: '6. Backups',
        icon: Download,
        title: 'Database Backup & Disaster Recovery',
        intro: 'To comply with the 14-day persistent backup requirement:',
        steps: [
            { text: 'Click "Export Database Backup" in the Admin panel top bar or Settings tab.' },
            { text: 'A JSON backup file containing all bookings, pricing, expenses, investors, shop orders, and match results is downloaded to your machine.' },
            { text: 'Keep backups in your secure Google Drive or local storage.' },
            { text: 'Backups are read-only JSON exports. All live data is stored in the MongoDB database, so restoring a new server means restoring the database itself (Atlas snapshot or mongorestore), not uploading this file.' }
        ]
    }
];

const TOPIC_OPTIONS = TOPICS.map(t => ({ value: t.id, label: t.label, icon: t.icon }));

/** Arena admin handover guide: the official operating manual for owners and managers. */
export function HandoverGuideSheet({ visible, onClose }) {
    const [activeTopic, setActiveTopic] = useState('walkin');
    const topic = TOPICS.find(t => t.id === activeTopic) || TOPICS[0];

    return (
        <Sheet
            visible={visible}
            onClose={onClose}
            title="Arena Admin Handover Guide"
            subtitle="Official operating manual for Crossbar Metro Arena owners & managers (bookcrossbar.com)"
            icon={BookOpen}
            full
            footer={(
                <Row justify="space-between">
                    <AppText size="xs" tone="muted" style={{ flex: 1 }}>
                        {'Technical Support: '}
                        <AppText size="xs" weight="800" tone="soft">bookcrossbar@gmail.com</AppText>
                    </AppText>
                    <Button title="Close Guide" size="sm" onPress={onClose} />
                </Row>
            )}
        >
            <Segmented scroll size="sm" value={activeTopic} onChange={setActiveTopic} options={TOPIC_OPTIONS} />

            <Heading level={3} tone="brand" upper>{topic.title}</Heading>
            <AppText size="sm" tone="soft">{topic.intro}</AppText>
            <View style={{ gap: spacing.md }}>
                {topic.steps.map((step, i) => (
                    <Row key={step.text} align="flex-start" gap={spacing.sm}>
                        <Mono size="sm" tone="brand">{`${i + 1}.`}</Mono>
                        <View style={{ flex: 1, gap: 6 }}>
                            <AppText size="sm" tone="soft">{step.text}</AppText>
                            {Array.isArray(step.bullets) ? step.bullets.map(bullet => (
                                <Row key={bullet} align="flex-start" gap={spacing.sm}>
                                    <AppText size="sm" tone="muted">•</AppText>
                                    <AppText size="xs" tone="muted" style={{ flex: 1 }}>{bullet}</AppText>
                                </Row>
                            )) : null}
                        </View>
                    </Row>
                ))}
            </View>
        </Sheet>
    );
}
