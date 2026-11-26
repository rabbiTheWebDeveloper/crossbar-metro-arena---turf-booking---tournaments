import { VENUE_INFO } from '@/data/initialData';
import { formatMonth, paymentMethodLabel, payoutDetailsSummary } from '@/data/finance';

/**
 * Canonical invoice builders for every Crossbar Metro Arena record:
 *   - Turf Slot Bookings (Admin & Customer)
 *   - Online / Desk Payment Receipts (Admin & Customer)
 *   - Investor Dividend Payout Vouchers (Admin & Investor)
 *   - Investor Monthly Profit & Lifetime Payout Statements (Admin & Investor)
 *   - Pro Shop Counter Orders (Admin & Customer)
 *   - Tournament Team Registrations (Admin & Customer)
 *   - Refund Credit Notes / Vouchers (Admin & Customer)
 *   - Custom Manual Invoices created in Admin Portal
 */

export function normalizeVenue(siteSettings) {
    const s = siteSettings || {};
    return {
        name: s.businessName || VENUE_INFO.businessName,
        tagline: s.tagline || VENUE_INFO.tagline,
        address: s.address || VENUE_INFO.address,
        phone: s.phoneFormatted || s.phone || VENUE_INFO.phoneFormatted,
        email: s.email || VENUE_INFO.email,
        website: s.website || VENUE_INFO.website
    };
}

function fmtDateShort(input) {
    if (!input) return new Date().toISOString().slice(0, 10);
    if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return String(input).slice(0, 10);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(d);
}

function methodPretty(method, fallback = 'Counter / Cash') {
    if (!method) return fallback;
    const m = String(method).trim();
    if (!m || m === 'unpaid' || m === 'pay_at_turf') return 'Pay at Arena Desk';
    if (m === 'eps') return 'EPS Online Gateway';
    return paymentMethodLabel(m) || m.replaceAll('_', ' ');
}

/** 1. Turf Slot Booking Invoice (Customer & Admin) */
export function buildBookingInvoice(booking, siteSettings) {
    const b = booking || {};
    const venue = normalizeVenue(siteSettings);
    const code = b.bookingCode || `BK-${String(b.id || '').slice(-6).toUpperCase() || '0001'}`;
    const addOns = Array.isArray(b.addOns) ? b.addOns : [];
    const addOnsSum = addOns.reduce((s, a) => s + (Number(a?.price) || 0), 0);
    const total = Number(b.totalPrice ?? 0) || 0;
    const courtPrice = Number(b.courtPrice ?? Math.max(0, total - addOnsSum)) || 0;
    const paid = Number(b.advanceAmount ?? 0) || 0;
    const due = b.paymentStatus === 'cancelled'
        ? 0
        : (Number(b.dueAmount ?? Math.max(0, total - paid)) || 0);

    const statusMap = {
        paid_full: { badge: 'PAID IN FULL', tone: 'emerald' },
        paid_advance: { badge: 'ADVANCE PAID', tone: 'emerald' },
        confirmed_unpaid: { badge: 'PAY AT ARENA', tone: 'amber' },
        pending_payment: { badge: 'PAYMENT PENDING', tone: 'sky' },
        needs_refund: { badge: 'REFUND PENDING', tone: 'violet' },
        cancelled: { badge: 'CANCELLED', tone: 'rose' }
    };
    const st = statusMap[b.paymentStatus] || { badge: 'CONFIRMED', tone: 'emerald' };

    const items = [
        {
            description: `${b.courtName || venue.name} — 90-Minute Turf Slot`,
            meta: `Match Date: ${b.date || '—'} · Slot #${b.slotNumber || '—'} (${b.displayTime || `${b.startTime || ''} - ${b.endTime || ''}`})${b.matchType ? ` · ${String(b.matchType).toUpperCase()}` : ''}`,
            quantity: 1,
            unitPrice: courtPrice,
            amount: courtPrice
        },
        ...addOns.map(a => ({
            description: `Equipment Add-On: ${typeof a === 'string' ? a : (a?.name || 'Match Extra')}`,
            meta: typeof a === 'object' && a?.description ? a.description : 'Optional match-day turf equipment',
            quantity: 1,
            unitPrice: Number(a?.price) || 0,
            amount: Number(a?.price) || 0
        }))
    ];

    const txn = b.epsTransactionId || b.transactionId || b.gatewayTranId || '';

    return {
        kind: 'booking',
        docTypeLabel: 'TURF BOOKING INVOICE',
        invoiceNumber: `INV-${code}`,
        referenceCode: code,
        issueDate: fmtDateShort(b.paidAt || b.createdAt || b.date),
        dueDate: b.date || '',
        statusBadge: st.badge,
        statusTone: st.tone,
        venue,
        partyLabel: 'BILLED TO (CAPTAIN / SQUAD)',
        recipient: {
            name: b.captainName || 'Squad Captain',
            subtitle: b.teamName ? `Squad: ${b.teamName}${b.playerCount ? ` (${b.playerCount} Players)` : ''}` : '',
            phone: b.captainPhone || '',
            email: b.captainEmail || ''
        },
        highlights: [
            { label: 'Booking Code', value: code },
            { label: 'Match Date', value: b.date || '—' },
            { label: 'Kickoff Slot', value: b.displayTime || `Slot #${b.slotNumber || '—'}` },
            { label: 'Payment Channel', value: b.gatewayCardType || methodPretty(b.paymentMethod) }
        ],
        items,
        subtotal: courtPrice + addOnsSum,
        discount: 0,
        tax: 0,
        totalAmount: total || (courtPrice + addOnsSum),
        paidLabel: 'Amount Paid',
        paidAmount: paid,
        dueLabel: 'Balance Due at Arena',
        dueAmount: due,
        paymentMethod: b.gatewayCardType || methodPretty(b.paymentMethod),
        transactionRef: txn,
        notes: b.notes || 'Please arrive 15 minutes prior to kickoff with turf shoes (TF) or AG studs. Metal studs are strictly prohibited.',
        authorizedBy: b.isWalkIn ? 'Arena Front Desk' : 'Crossbar Automated Booking System'
    };
}

/** 2. Payment Ledger Receipt / Invoice (Admin Payments & Customer) */
export function buildPaymentInvoice(payment, linkedBooking, siteSettings) {
    if (linkedBooking && !linkedBooking.isPublicView) {
        const base = buildBookingInvoice(linkedBooking, siteSettings);
        const txn = payment?.gatewayTransactionId || payment?.merchantTransactionId || base.transactionRef;
        return {
            ...base,
            kind: 'payment',
            docTypeLabel: 'OFFICIAL PAYMENT RECEIPT',
            invoiceNumber: `RCPT-${payment?.bookingCode || base.referenceCode}-${String(payment?.id || '').slice(-4).toUpperCase() || '01'}`,
            issueDate: fmtDateShort(payment?.verifiedAt || payment?.createdAt),
            transactionRef: txn,
            paymentMethod: payment?.financialEntity || methodPretty(payment?.paymentMethod || payment?.gateway)
        };
    }

    const p = payment || {};
    const venue = normalizeVenue(siteSettings);
    const amt = Number(p.amount) || 0;
    const code = p.bookingCode || p.merchantTransactionId || `PAY-${String(p.id || '').slice(-6).toUpperCase()}`;
    const isPaid = p.status === 'success';
    const isRefunded = p.status === 'refunded';

    return {
        kind: 'payment',
        docTypeLabel: 'OFFICIAL PAYMENT RECEIPT',
        invoiceNumber: `RCPT-${String(code).slice(0, 18)}`,
        referenceCode: p.bookingCode || code,
        issueDate: fmtDateShort(p.verifiedAt || p.createdAt),
        dueDate: p.slotDate || '',
        statusBadge: isPaid ? 'PAYMENT VERIFIED' : isRefunded ? 'REFUNDED' : String(p.status || 'INITIATED').toUpperCase(),
        statusTone: isPaid ? 'emerald' : isRefunded ? 'violet' : 'amber',
        venue,
        partyLabel: 'RECEIVED FROM',
        recipient: {
            name: p.customerName || 'Arena Customer',
            subtitle: p.teamName ? `Squad: ${p.teamName}` : '',
            phone: p.customerPhone || '',
            email: p.customerEmail || ''
        },
        highlights: [
            { label: 'Booking Ref', value: p.bookingCode || '—' },
            { label: 'Slot Date', value: p.slotDate || '—' },
            { label: 'Slot Time', value: p.slotDisplay || (p.slotNumber ? `Slot #${p.slotNumber}` : '—') },
            { label: 'Gateway', value: p.financialEntity || String(p.gateway || 'counter').toUpperCase() }
        ],
        items: [
            {
                description: `Turf Booking Payment${p.bookingCode ? ` (${p.bookingCode})` : ''}`,
                meta: p.slotDate ? `Match Date: ${p.slotDate} · ${p.slotDisplay || `Slot #${p.slotNumber || ''}`}` : 'Online / Counter Booking Settlement',
                quantity: 1,
                unitPrice: amt,
                amount: amt
            }
        ],
        subtotal: amt,
        discount: 0,
        tax: 0,
        totalAmount: amt,
        paidLabel: 'Amount Verified',
        paidAmount: isPaid ? amt : 0,
        dueLabel: 'Unsettled Amount',
        dueAmount: isPaid ? 0 : amt,
        paymentMethod: p.financialEntity || methodPretty(p.paymentMethod || p.gateway),
        transactionRef: p.gatewayTransactionId || p.merchantTransactionId || '',
        notes: p.notes || 'Official payment receipt issued by Crossbar Metro Arena.',
        authorizedBy: p.recordedBy || 'EPS / Arena Payment Desk'
    };
}

/** 3. Investor Dividend Payout Voucher / Invoice (Admin & Investor Portal) */
export function buildPayoutInvoice(payout, investor, monthlyFinance, siteSettings) {
    const pay = payout || {};
    const inv = investor || {};
    const venue = normalizeVenue(siteSettings);
    const amount = Number(pay.amount) || 0;
    const sharePct = inv.sharePercentage ?? null;
    const capital = Number(inv.capitalInvested) || 0;
    const monthLabel = pay.month ? formatMonth(pay.month) : 'Profit Distribution';
    const shortId = String(pay.id || pay._id || '').slice(-6).toUpperCase() || '0001';
    const voucherNo = `PAY-${(pay.month || 'DIV').replace('-', '')}-${shortId}`;
    const payoutSummary = payoutDetailsSummary(inv.payoutDetails);

    const highlights = [
        { label: 'Profit Period', value: monthLabel },
        { label: 'Disbursed Date', value: pay.datePaid || fmtDateShort(pay.createdAt) },
        { label: 'Equity Share', value: sharePct !== null ? `${sharePct}% Partner` : 'Equity Partner' },
        { label: 'Disbursement Via', value: methodPretty(pay.paymentMethod, 'Bank Transfer') }
    ];

    const netProfitInfo = monthlyFinance && typeof monthlyFinance.netProfit === 'number'
        ? `Arena Net Profit: ৳${Math.round(monthlyFinance.netProfit).toLocaleString()}${sharePct !== null ? ` · ${sharePct}% Allocation` : ''}`
        : (sharePct !== null ? `${sharePct}% Equity Share Dividend Distribution` : 'Partner Profit Share Distribution');

    return {
        kind: 'investor_payout',
        docTypeLabel: 'INVESTOR PAYOUT VOUCHER',
        invoiceNumber: voucherNo,
        referenceCode: pay.month || voucherNo,
        issueDate: fmtDateShort(pay.datePaid || pay.createdAt),
        dueDate: '',
        statusBadge: 'DISBURSED / PAID',
        statusTone: 'emerald',
        venue,
        partyLabel: 'PAYEE (EQUITY PARTNER)',
        recipient: {
            name: pay.investorName || inv.name || 'Equity Partner',
            subtitle: [
                sharePct !== null ? `${sharePct}% Equity Shareholder` : 'Equity Shareholder',
                capital > 0 ? `Capital Invested: ৳${capital.toLocaleString()}` : ''
            ].filter(Boolean).join(' · '),
            phone: inv.phone || '',
            email: inv.email || ''
        },
        highlights,
        items: [
            {
                description: `Monthly Dividend Payout — ${monthLabel}`,
                meta: [netProfitInfo, payoutSummary ? `Account: ${payoutSummary}` : ''].filter(Boolean).join(' · '),
                quantity: 1,
                unitPrice: amount,
                amount
            }
        ],
        subtotal: amount,
        discount: 0,
        tax: 0,
        totalAmount: amount,
        paidLabel: 'Dividend Disbursed',
        paidAmount: amount,
        dueLabel: 'Remaining Voucher Balance',
        dueAmount: 0,
        paymentMethod: methodPretty(pay.paymentMethod, 'Bank Transfer'),
        transactionRef: pay.transactionNote || '',
        notes: monthlyFinance
            ? `Monthly Summary (${monthLabel}): Gross Revenue ৳${Math.round(monthlyFinance.totalRevenue || 0).toLocaleString()} · Expenses ৳${Math.round(monthlyFinance.totalExpenses || 0).toLocaleString()} · Net Profit ৳${Math.round(monthlyFinance.netProfit || 0).toLocaleString()}.`
            : 'Confidential partner profit distribution voucher issued by Crossbar Metro Arena.',
        authorizedBy: pay.recordedBy || 'Arena Finance & Accounts'
    };
}

/** 4. Investor Monthly Profit Statement OR Multi-Payout Ledger Statement (Admin & Investor) */
export function buildInvestorStatementInvoice({ investor, payouts = [], month, monthlyFinance, siteSettings }) {
    const inv = investor || {};
    const venue = normalizeVenue(siteSettings);
    const sharePct = Number(inv.sharePercentage) || 0;
    const capital = Number(inv.capitalInvested) || 0;

    // Mode A: Single-month profit & share statement
    if (month && monthlyFinance) {
        const monthLabel = formatMonth(month);
        const shareEntry = (monthlyFinance.investorShares || []).find(s => s.investor?.id === inv.id);
        const allocated = shareEntry ? Math.round(shareEntry.shareAmount) : Math.max(0, Math.round(((monthlyFinance.netProfit || 0) * sharePct) / 100));
        const paid = shareEntry ? Math.round(shareEntry.paidAmount) : payouts.filter(p => p.month === month).reduce((s, p) => s + (Number(p.amount) || 0), 0);
        const balance = Math.max(0, allocated - paid);

        return {
            kind: 'investor_statement',
            docTypeLabel: 'PARTNER MONTHLY STATEMENT',
            invoiceNumber: `STMT-${month.replace('-', '')}-${String(inv.id || 'INV').slice(-4).toUpperCase()}`,
            referenceCode: month,
            issueDate: fmtDateShort(new Date()),
            dueDate: '',
            statusBadge: allocated === 0 ? 'NO DIVIDEND' : balance <= 0 ? 'SETTLED IN FULL' : 'BALANCE OWED',
            statusTone: allocated === 0 ? 'slate' : balance <= 0 ? 'emerald' : 'amber',
            venue,
            partyLabel: 'STATEMENT FOR (EQUITY PARTNER)',
            recipient: {
                name: inv.name || 'Equity Partner',
                subtitle: `${sharePct}% Equity Share${capital > 0 ? ` · Capital Invested: ৳${capital.toLocaleString()}` : ''}`,
                phone: inv.phone || '',
                email: inv.email || ''
            },
            highlights: [
                { label: 'Statement Month', value: monthLabel },
                { label: 'Arena Gross Revenue', value: `৳${Math.round(monthlyFinance.totalRevenue || 0).toLocaleString()}` },
                { label: 'Arena Expenses', value: `৳${Math.round(monthlyFinance.totalExpenses || 0).toLocaleString()}` },
                { label: 'Arena Net Profit', value: `${monthlyFinance.netProfit < 0 ? '-' : ''}৳${Math.abs(Math.round(monthlyFinance.netProfit || 0)).toLocaleString()}` }
            ],
            items: [
                {
                    description: `Partner Equity Profit Allocation (${sharePct}% of Net Profit) — ${monthLabel}`,
                    meta: monthlyFinance.isLossMonth
                        ? 'Loss protection active (partners are never charged negative share)'
                        : `Slots Booked: ${monthlyFinance.slotsBooked || 0} (${(monthlyFinance.occupancyRate || 0).toFixed(1)}% occupancy)`,
                    quantity: 1,
                    unitPrice: allocated,
                    amount: allocated
                }
            ],
            subtotal: allocated,
            discount: 0,
            tax: 0,
            totalAmount: allocated,
            paidLabel: 'Disbursed for Month',
            paidAmount: paid,
            dueLabel: 'Unpaid Partner Balance',
            dueAmount: balance,
            paymentMethod: payoutDetailsSummary(inv.payoutDetails) || 'Partner Payout Account',
            transactionRef: `${payouts.filter(p => p.month === month).length} payout record(s)`,
            notes: `Official monthly partner profit-share statement for ${monthLabel}.`,
            authorizedBy: 'Crossbar Finance & Partner Relations'
        };
    }

    // Mode B: Consolidated Payout History Ledger Statement
    const sorted = [...payouts].sort((a, b) => String(b.datePaid || b.createdAt || '').localeCompare(String(a.datePaid || a.createdAt || '')));
    const totalDisbursed = sorted.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const items = sorted.length > 0
        ? sorted.map(p => ({
            description: `Dividend Payout — ${p.month ? formatMonth(p.month) : 'Distribution'}`,
            meta: `Paid ${p.datePaid || fmtDateShort(p.createdAt)} · ${methodPretty(p.paymentMethod)}${p.transactionNote ? ` · ${p.transactionNote}` : ''}`,
            quantity: 1,
            unitPrice: Number(p.amount) || 0,
            amount: Number(p.amount) || 0
        }))
        : [{
            description: 'No dividend distributions recorded to date',
            meta: 'Cumulative partner payout statement',
            quantity: 1,
            unitPrice: 0,
            amount: 0
        }];

    return {
        kind: 'investor_statement',
        docTypeLabel: 'DIVIDEND PAYOUT STATEMENT',
        invoiceNumber: `STMT-ALL-${String(inv.id || 'INV').slice(-6).toUpperCase()}`,
        referenceCode: `${sorted.length} PAYOUTS`,
        issueDate: fmtDateShort(new Date()),
        dueDate: '',
        statusBadge: 'OFFICIAL LEDGER',
        statusTone: 'emerald',
        venue,
        partyLabel: 'EQUITY PARTNER',
        recipient: {
            name: inv.name || 'Equity Partner',
            subtitle: `${sharePct}% Equity Share${capital > 0 ? ` · Capital Invested: ৳${capital.toLocaleString()}` : ''}`,
            phone: inv.phone || '',
            email: inv.email || ''
        },
        highlights: [
            { label: 'Total Payouts', value: `${sorted.length} Distribution(s)` },
            { label: 'Equity Share', value: `${sharePct}%` },
            { label: 'Capital Invested', value: `৳${capital.toLocaleString()}` },
            { label: 'Total Disbursed', value: `৳${totalDisbursed.toLocaleString()}` }
        ],
        items,
        subtotal: totalDisbursed,
        discount: 0,
        tax: 0,
        totalAmount: totalDisbursed,
        paidLabel: 'Total Dividends Received',
        paidAmount: totalDisbursed,
        dueLabel: 'Balance',
        dueAmount: 0,
        paymentMethod: payoutDetailsSummary(inv.payoutDetails) || 'Multiple Payout Channels',
        transactionRef: '',
        notes: 'Consolidated lifetime dividend distribution statement issued by Crossbar Metro Arena.',
        authorizedBy: 'Crossbar Finance & Partner Relations'
    };
}

/** 5. Pro Shop Counter Order Invoice (Admin & Customer) */
export function buildShopOrderInvoice(order, siteSettings) {
    const o = order || {};
    const venue = normalizeVenue(siteSettings);
    const code = o.reservationCode || `SHOP-${String(o.id || '').slice(-6).toUpperCase()}`;
    const rawItems = Array.isArray(o.items) && o.items.length
        ? o.items
        : [{ name: o.productName || 'Pro Shop Gear', size: o.size || '', quantity: 1, price: Number(o.totalAmount ?? o.price) || 0 }];

    const items = rawItems.map(it => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unit = Number(it.price) || 0;
        return {
            description: it.name || 'Pro Shop Item',
            meta: it.size ? `Size / Variant: ${it.size}` : 'Arena Pro Shop Pickup',
            quantity: qty,
            unitPrice: unit,
            amount: qty * unit
        };
    });

    const computedTotal = items.reduce((s, i) => s + i.amount, 0);
    const total = Number(o.totalAmount ?? o.price) || computedTotal;
    const isCollected = o.status === 'collected';
    const isCancelled = o.status === 'cancelled';

    return {
        kind: 'shop_order',
        docTypeLabel: 'PRO SHOP ORDER INVOICE',
        invoiceNumber: `INV-${code}`,
        referenceCode: code,
        issueDate: fmtDateShort(o.collectedAt || o.createdAt),
        dueDate: o.pickupDate || '',
        statusBadge: isCollected ? 'COLLECTED & PAID' : isCancelled ? 'CANCELLED' : 'AWAITING PICKUP',
        statusTone: isCollected ? 'emerald' : isCancelled ? 'rose' : 'amber',
        venue,
        partyLabel: 'CUSTOMER',
        recipient: {
            name: o.customerName || 'Shop Customer',
            subtitle: o.pickupDate ? `Scheduled Counter Pickup: ${o.pickupDate}` : 'Counter Pickup Reservation',
            phone: o.customerPhone || '',
            email: ''
        },
        highlights: [
            { label: 'Order Code', value: code },
            { label: 'Order Status', value: isCollected ? 'Collected' : isCancelled ? 'Cancelled' : 'Reserved for Pickup' },
            { label: 'Pickup Date', value: o.pickupDate || 'At Arena Desk' },
            { label: 'Items Count', value: `${items.reduce((s, i) => s + i.quantity, 0)} Item(s)` }
        ],
        items,
        subtotal: total,
        discount: 0,
        tax: 0,
        totalAmount: total,
        paidLabel: 'Amount Paid',
        paidAmount: isCollected ? total : 0,
        dueLabel: 'Payable at Counter',
        dueAmount: isCollected || isCancelled ? 0 : total,
        paymentMethod: isCollected ? 'Arena Counter' : 'Pay on Pickup',
        transactionRef: code,
        notes: o.notes || 'Present your order code at the Crossbar Metro Arena Pro Shop desk to collect your gear.',
        authorizedBy: 'Crossbar Pro Shop Desk'
    };
}

/** 6. Tournament Team Registration Invoice (Admin & Customer) */
export function buildRegistrationInvoice(reg, siteSettings) {
    const r = reg || {};
    const venue = normalizeVenue(siteSettings);
    const shortId = String(r.id || '').slice(-6).toUpperCase() || 'CUP01';
    const code = `REG-${shortId}`;
    const fee = Number(r.amount) || 0;
    const confirmed = r.status === 'confirmed' || r.status === 'verified';
    const rejected = r.status === 'rejected';
    const paid = confirmed && r.paymentMethod !== 'pay_at_turf' ? fee : (r.transactionId && !rejected ? fee : 0);
    const due = rejected ? 0 : Math.max(0, fee - paid);

    const playersCount = Array.isArray(r.playersList) && r.playersList.length
        ? r.playersList.length
        : (Number(r.playerCount) || 0);

    return {
        kind: 'tournament',
        docTypeLabel: 'TOURNAMENT ENTRY INVOICE',
        invoiceNumber: `INV-${code}`,
        referenceCode: code,
        issueDate: fmtDateShort(r.createdAt || r.registeredAt),
        dueDate: '',
        statusBadge: confirmed ? 'CONFIRMED ENTRY' : rejected ? 'REJECTED' : 'PENDING REVIEW',
        statusTone: confirmed ? 'emerald' : rejected ? 'rose' : 'amber',
        venue,
        partyLabel: 'REGISTERED SQUAD / CAPTAIN',
        recipient: {
            name: r.captainName || 'Team Captain',
            subtitle: `Team: ${r.teamName || '—'}${playersCount ? ` · ${playersCount} Players` : ''}${r.jerseyColor ? ` · Kit: ${r.jerseyColor}` : ''}`,
            phone: r.captainPhone || '',
            email: r.captainEmail || ''
        },
        highlights: [
            { label: 'Tournament', value: r.tournamentTitle || 'Arena Championship' },
            { label: 'Squad Name', value: r.teamName || '—' },
            { label: 'Entry Status', value: confirmed ? 'Approved' : String(r.status || 'Pending') },
            { label: 'Payment Method', value: methodPretty(r.paymentMethod) }
        ],
        items: [
            {
                description: `Tournament Team Registration — ${r.tournamentTitle || 'Crossbar Cup'}`,
                meta: `Squad: ${r.teamName || '—'}${playersCount ? ` (${playersCount} registered players)` : ''}`,
                quantity: 1,
                unitPrice: fee,
                amount: fee
            }
        ],
        subtotal: fee,
        discount: 0,
        tax: 0,
        totalAmount: fee,
        paidLabel: 'Entry Fee Paid',
        paidAmount: paid,
        dueLabel: 'Entry Fee Due',
        dueAmount: due,
        paymentMethod: methodPretty(r.paymentMethod),
        transactionRef: r.transactionId || '',
        notes: r.notes || 'Official tournament squad entry invoice issued by Crossbar Metro Arena.',
        authorizedBy: 'Tournament Committee · Crossbar Metro Arena'
    };
}

/** 7. Refund Credit Note / Voucher (Admin & Customer) */
export function buildRefundInvoice(refund, siteSettings) {
    const rf = refund || {};
    const venue = normalizeVenue(siteSettings);
    const amt = Number(rf.amount) || 0;
    const shortId = String(rf.id || '').slice(-6).toUpperCase() || '0001';
    const isCompleted = rf.status === 'completed';
    const isRejected = rf.status === 'rejected';

    return {
        kind: 'refund',
        docTypeLabel: 'REFUND CREDIT VOUCHER',
        invoiceNumber: `RFN-${rf.bookingCode || shortId}`,
        referenceCode: rf.bookingCode || shortId,
        issueDate: fmtDateShort(rf.refundedDate || rf.requestDate || rf.createdAt),
        dueDate: '',
        statusBadge: isCompleted ? 'REFUND COMPLETED' : isRejected ? 'CLAIM REJECTED' : String(rf.status || 'PENDING').toUpperCase(),
        statusTone: isCompleted ? 'emerald' : isRejected ? 'rose' : 'amber',
        venue,
        partyLabel: 'REFUND RECIPIENT',
        recipient: {
            name: rf.customerName || 'Customer',
            subtitle: rf.bookingCode ? `Cancelled Booking: ${rf.bookingCode}` : 'Booking Refund',
            phone: rf.customerPhone || '',
            email: ''
        },
        highlights: [
            { label: 'Booking Code', value: rf.bookingCode || '—' },
            { label: 'Request Date', value: rf.requestDate || '—' },
            { label: 'Refund Method', value: methodPretty(rf.refundMethod) },
            { label: 'Status', value: String(rf.status || 'pending').toUpperCase() }
        ],
        items: [
            {
                description: `Booking Cancellation Refund — ${rf.bookingCode || 'Turf Slot'}`,
                meta: `Reason: ${String(rf.reason || 'player_cancelled').replaceAll('_', ' ')}`,
                quantity: 1,
                unitPrice: amt,
                amount: amt
            }
        ],
        subtotal: amt,
        discount: 0,
        tax: 0,
        totalAmount: amt,
        paidLabel: 'Amount Refunded',
        paidAmount: isCompleted ? amt : 0,
        dueLabel: 'Pending Refund',
        dueAmount: isCompleted || isRejected ? 0 : amt,
        paymentMethod: methodPretty(rf.refundMethod),
        transactionRef: rf.transactionRef || '',
        notes: 'Official refund voucher from Crossbar Metro Arena.',
        authorizedBy: rf.recordedBy || 'Arena Accounts Desk'
    };
}

/** 8. Custom Admin-Created Invoice (from MongoDB Invoice model) */
export function buildCustomInvoice(doc, siteSettings) {
    const d = doc || {};
    const venue = normalizeVenue(siteSettings);
    const items = (Array.isArray(d.items) ? d.items : []).map(it => ({
        description: it.description || 'Item',
        meta: it.meta || '',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        amount: Number(it.amount ?? (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0)) || 0
    }));

    const subtotal = Number(d.subtotal ?? items.reduce((s, i) => s + i.amount, 0)) || 0;
    const discount = Number(d.discount) || 0;
    const tax = Number(d.tax) || 0;
    const total = Number(d.totalAmount ?? Math.max(0, subtotal - discount + tax)) || 0;
    const paid = Number(d.paidAmount) || 0;
    const due = d.status === 'cancelled' ? 0 : (Number(d.dueAmount ?? Math.max(0, total - paid)) || 0);

    const isPayout = d.category === 'investor_payout' || d.recipientRole === 'investor' || d.status === 'disbursed';
    const statusBadgeMap = {
        paid: isPayout ? 'DISBURSED / PAID' : 'PAID IN FULL',
        disbursed: 'DISBURSED / PAID',
        partial: 'PARTIALLY PAID',
        unpaid: 'UNPAID / DUE',
        cancelled: 'CANCELLED'
    };
    const toneMap = {
        paid: 'emerald',
        disbursed: 'emerald',
        partial: 'amber',
        unpaid: 'amber',
        cancelled: 'rose'
    };

    const categoryLabelMap = {
        booking: 'TURF BOOKING INVOICE',
        investor_payout: 'INVESTOR PAYOUT VOUCHER',
        shop_order: 'PRO SHOP INVOICE',
        tournament: 'TOURNAMENT INVOICE',
        sponsorship: 'SPONSORSHIP & EVENT INVOICE',
        custom: 'OFFICIAL ARENA INVOICE'
    };

    return {
        id: d.id || (d._id ? String(d._id) : ''),
        isCustomModel: true,
        kind: d.category || 'custom',
        docTypeLabel: categoryLabelMap[d.category] || 'OFFICIAL ARENA INVOICE',
        invoiceNumber: d.invoiceNumber || 'CMA-INV-DRAFT',
        referenceCode: d.invoiceNumber || '',
        issueDate: fmtDateShort(d.issueDate || d.createdAt),
        dueDate: d.dueDate || '',
        statusBadge: statusBadgeMap[d.status] || 'ISSUED',
        statusTone: toneMap[d.status] || 'emerald',
        venue,
        partyLabel: isPayout ? 'PAYEE (EQUITY PARTNER)' : 'BILLED TO',
        recipient: {
            name: d.recipientName || 'Recipient',
            subtitle: d.recipientSubtitle || '',
            phone: d.recipientPhone || '',
            email: d.recipientEmail || ''
        },
        highlights: [
            { label: 'Invoice No', value: d.invoiceNumber || '—' },
            { label: 'Issue Date', value: fmtDateShort(d.issueDate || d.createdAt) },
            { label: d.dueDate ? 'Due Date' : 'Category', value: d.dueDate || String(d.category || 'custom').replaceAll('_', ' ').toUpperCase() },
            { label: 'Payment Method', value: methodPretty(d.paymentMethod) }
        ],
        items,
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paidLabel: isPayout ? 'Amount Disbursed' : 'Amount Paid',
        paidAmount: paid,
        dueLabel: 'Balance Due',
        dueAmount: due,
        paymentMethod: methodPretty(d.paymentMethod),
        transactionRef: d.transactionRef || '',
        notes: d.notes || 'Official invoice issued by Crossbar Metro Arena.',
        authorizedBy: d.createdBy || 'Crossbar Admin Desk'
    };
}

/** 9. Bulk / Fixed-Slot Series Consolidated Schedule Invoice (every Date, Day & Time Slot itemized) */
export function buildBulkSeriesInvoice(series, siteSettings) {
    const s = series || {};
    const venue = normalizeVenue(siteSettings);
    const activeRows = (Array.isArray(s.bookings) ? s.bookings : []).filter(b => b.paymentStatus !== 'cancelled');
    const items = activeRows.length > 0
        ? activeRows.map(b => ({
            description: `Turf Slot — ${b.date} (${b.dayName || ''}) · ${b.displayTime || `Slot #${b.slotNumber}`}`,
            meta: `Ref: ${b.bookingCode}${b.played ? ' · Played' : ''}`,
            quantity: 1,
            unitPrice: Number(b.totalPrice) || 0,
            amount: Number(b.totalPrice) || 0
        }))
        : [{
            description: `Fixed-Slot Series (${s.firstDate || '—'} → ${s.lastDate || '—'})`,
            meta: `${s.active || 0} active slot(s)`,
            quantity: Math.max(1, Number(s.active) || 1),
            unitPrice: Math.round((Number(s.totalValue) || 0) / Math.max(1, Number(s.active) || 1)),
            amount: Number(s.totalValue) || 0
        }];

    const total = Number(s.totalValue) || items.reduce((acc, i) => acc + i.amount, 0);
    const paid = Number(s.collected) || 0;
    const due = Math.max(0, total - paid);
    const daySummary = Array.isArray(s.weekdayNames) && s.weekdayNames.length
        ? s.weekdayNames.map(d => d.slice(0, 3)).join(', ')
        : 'Custom Dates';
    const timeSummary = Array.isArray(s.slotDetails) && s.slotDetails.length
        ? s.slotDetails.map(sd => sd.displayTime).join(', ')
        : `Slot(s) ${(s.slots || []).join(', ')}`;

    return {
        kind: 'booking',
        docTypeLabel: 'BULK SERIES SCHEDULE INVOICE',
        invoiceNumber: `INV-${s.seriesId || 'SERIES'}`,
        referenceCode: s.seriesId || 'SERIES',
        issueDate: fmtDateShort(s.createdAt || s.firstDate),
        dueDate: s.lastDate || '',
        statusBadge: due <= 0 && total > 0 ? 'PAID IN FULL' : paid > 0 ? 'PARTIAL / ADVANCE' : 'PAY AT ARENA',
        statusTone: due <= 0 && total > 0 ? 'emerald' : 'amber',
        venue,
        partyLabel: 'BILLED TO (CLUB / SQUAD)',
        recipient: {
            name: s.captainName || 'Team Captain',
            subtitle: `Team: ${s.teamName || '—'} · ${activeRows.length || s.active || 0} Scheduled Sessions`,
            phone: s.captainPhone || '',
            email: ''
        },
        highlights: [
            { label: 'Date Range', value: `${s.firstDate || '—'} to ${s.lastDate || '—'}` },
            { label: 'Match Days', value: daySummary },
            { label: 'Kickoff Time', value: timeSummary },
            { label: 'Active Slots', value: `${activeRows.length || s.active || 0} Sessions` }
        ],
        items,
        subtotal: total,
        discount: 0,
        tax: 0,
        totalAmount: total,
        paidLabel: 'Total Collected',
        paidAmount: paid,
        dueLabel: 'Series Balance Due',
        dueAmount: due,
        paymentMethod: 'Counter / Package Account',
        transactionRef: s.seriesId || '',
        notes: s.notes || 'Official bulk fixed-slot schedule & billing statement from Crossbar Metro Arena.',
        authorizedBy: 'Crossbar Arena Bookings Desk'
    };
}

