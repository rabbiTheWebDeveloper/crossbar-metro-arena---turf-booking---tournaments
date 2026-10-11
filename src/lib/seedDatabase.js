import { connectToDatabase } from './mongodb.js';
import {
    Booking,
    Setting,
    Expense,
    Investor,
    Payout,
    Refund,
    OtherIncome,
    Product,
    ShopReservation,
    Tournament,
    TournamentRegistration,
    MatchResult,
    GalleryPhoto,
    Team
} from '../models/index.js';
import {
    INITIAL_BOOKINGS,
    INITIAL_EXPENSES,
    INITIAL_INVESTORS,
    INITIAL_PAYOUTS,
    INITIAL_REFUNDS,
    INITIAL_OTHER_INCOME,
    INITIAL_SHOP_PRODUCTS,
    INITIAL_TOURNAMENTS,
    INITIAL_MATCH_RESULTS,
    INITIAL_GALLERY_PHOTOS,
    INITIAL_TEAMS,
    SCHEDULE_SLOTS_DEFINITION
} from '../data/initialData.js';

export async function ensureDatabaseSeeded() {
    await connectToDatabase();

    // 1. Settings & Slot Pricing
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
        console.log('🌱 Seeding initial Arena Settings...');
        await Setting.create({ slotPrices: SCHEDULE_SLOTS_DEFINITION });
    }

    // 2. Bookings
    const bookingsCount = await Booking.countDocuments();
    if (bookingsCount === 0) {
        console.log('🌱 Seeding initial Bookings...');
        for (const b of INITIAL_BOOKINGS) {
            try {
                await Booking.create({
                    bookingCode: b.bookingCode,
                    courtId: b.courtId || 'main-turf',
                    courtName: b.courtName || 'Crossbar Metro Arena (Main Turf)',
                    date: b.date,
                    slotNumber: b.slotNumber,
                    startTime: b.startTime,
                    endTime: b.endTime,
                    displayTime: b.displayTime,
                    captainName: b.captainName,
                    captainPhone: b.captainPhone,
                    teamName: b.teamName,
                    playerCount: b.playerCount || 14,
                    matchType: b.matchType || 'friendly',
                    addOns: b.addOns || [],
                    courtPrice: b.courtPrice,
                    addOnsPrice: b.addOnsPrice || 0,
                    totalPrice: b.totalPrice,
                    paymentType: b.paymentType || 'advance_500',
                    advanceAmount: b.advanceAmount || 500,
                    dueAmount: b.dueAmount || 0,
                    paymentMethod: b.paymentMethod || 'bkash',
                    paymentStatus: b.paymentStatus || 'paid_advance',
                    transactionId: b.transactionId || 'BK-INIT-01',
                    isWalkIn: b.isWalkIn || false,
                    notes: b.notes || ''
                });
            } catch (err) {
                console.warn('Booking seed duplicate or error:', err.message);
            }
        }
    }

    // 3. Expenses
    const expensesCount = await Expense.countDocuments();
    if (expensesCount === 0) {
        console.log('🌱 Seeding initial Expenses...');
        await Expense.insertMany(INITIAL_EXPENSES.map(e => ({
            title: e.title,
            category: e.category,
            amount: e.amount,
            date: e.date,
            receiptNote: e.receiptNote || '',
            recordedBy: e.recordedBy || 'Admin Abid'
        })));
    }

    // 4. Investors
    const investorsCount = await Investor.countDocuments();
    if (investorsCount === 0) {
        console.log('🌱 Seeding initial Investors...');
        await Investor.insertMany(INITIAL_INVESTORS.map(i => ({
            name: i.name,
            email: i.email,
            phone: i.phone,
            sharePercentage: i.sharePercentage,
            capitalInvested: i.capitalInvested,
            joinedDate: i.joinedDate,
            payoutsPaid: i.payoutsPaid || 0,
            status: i.status || 'active'
        })));
    }

    // 5. Payouts
    const payoutsCount = await Payout.countDocuments();
    if (payoutsCount === 0) {
        console.log('🌱 Seeding initial Payouts...');
        await Payout.insertMany(INITIAL_PAYOUTS.map(p => ({
            investorId: p.investorId,
            investorName: p.investorName,
            month: p.month,
            amount: p.amount,
            datePaid: p.datePaid,
            paymentMethod: p.paymentMethod || 'bank_transfer',
            transactionNote: p.transactionNote || '',
            recordedBy: p.recordedBy || 'Admin Abid'
        })));
    }

    // 6. Refunds
    const refundsCount = await Refund.countDocuments();
    if (refundsCount === 0) {
        console.log('🌱 Seeding initial Refunds...');
        await Refund.insertMany(INITIAL_REFUNDS.map(r => ({
            bookingId: r.bookingId || '',
            bookingCode: r.bookingCode,
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            amount: r.amount,
            reason: r.reason || 'player_cancelled',
            refundMethod: r.refundMethod || 'bkash',
            status: r.status || 'completed',
            requestDate: r.requestDate,
            refundedDate: r.refundedDate || '',
            transactionRef: r.transactionRef || '',
            recordedBy: r.recordedBy || 'Admin Desk'
        })));
    }

    // 7. Other Income
    const incomeCount = await OtherIncome.countDocuments();
    if (incomeCount === 0) {
        console.log('🌱 Seeding initial Other Income...');
        await OtherIncome.insertMany(INITIAL_OTHER_INCOME.map(o => ({
            source: o.source,
            title: o.title,
            amount: o.amount,
            date: o.date,
            notes: o.notes || '',
            recordedBy: o.recordedBy || 'Staff'
        })));
    }

    // 8. Products
    const productsCount = await Product.countDocuments();
    if (productsCount === 0) {
        console.log('🌱 Seeding initial Products...');
        await Product.insertMany(INITIAL_SHOP_PRODUCTS.map(p => ({
            name: p.name,
            category: p.category,
            price: p.price,
            salePrice: p.salePrice || p.price,
            stock: p.stock,
            sizes: p.sizes || [],
            badge: p.badge || '',
            description: p.description || '',
            specs: p.specs || [],
            inStock: p.inStock ?? true,
            featured: p.featured ?? false,
            visible: p.visible ?? true,
            image: p.image
        })));
    }

    // 9. Tournaments
    const tournamentsCount = await Tournament.countDocuments();
    if (tournamentsCount === 0) {
        console.log('🌱 Seeding initial Tournaments...');
        await Tournament.insertMany(INITIAL_TOURNAMENTS.map(t => ({
            title: t.title,
            edition: t.edition || 'Season Cup',
            category: t.category,
            format: t.format,
            dates: t.dates,
            registrationDeadline: t.registrationDeadline,
            entryFee: t.entryFee,
            prizePool: t.prizePool,
            firstPrize: t.firstPrize || '',
            runnerUpPrize: t.runnerUpPrize || '',
            maxTeams: t.maxTeams,
            registeredCount: t.registeredCount || 0,
            status: t.status || 'open',
            highlights: t.highlights || [],
            rules: t.rules || [],
            bannerUrl: t.bannerUrl || ''
        })));
    }

    // 10. Match Results
    const resultsCount = await MatchResult.countDocuments();
    if (resultsCount === 0) {
        console.log('🌱 Seeding initial Match Results...');
        await MatchResult.insertMany(INITIAL_MATCH_RESULTS.map(m => ({
            date: m.date,
            slotDisplay: m.slotDisplay,
            courtName: m.courtName || 'Crossbar Metro Arena (Main Turf)',
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            scorers: (m.scorers || []).map(s => ({
                playerName: s.playerName,
                teamName: s.teamName,
                minute: s.minute
            })),
            yellowCards: m.yellowCards || 0,
            redCards: m.redCards || 0,
            playerOfTheMatch: m.playerOfTheMatch || '',
            matchReport: m.matchReport || '',
            teamPhoto: m.teamPhoto || '',
            matchType: m.matchType || '7v7 Friendly',
            postedBy: m.postedBy || 'Admin Desk',
            postedAt: m.postedAt || new Date().toISOString(),
            status: m.status || 'published'
        })));
    }

    // 11. Gallery Photos
    const galleryCount = await GalleryPhoto.countDocuments();
    if (galleryCount === 0) {
        console.log('🌱 Seeding initial Gallery Photos...');
        await GalleryPhoto.insertMany(INITIAL_GALLERY_PHOTOS.map(g => ({
            title: g.title,
            album: g.album || 'Arena',
            caption: g.caption || '',
            url: g.url,
            aspect: g.aspect || 'wide',
            featured: g.featured ?? false,
            uploadedAt: g.uploadedAt,
            photographer: g.photographer || 'Media Desk',
            tags: g.tags || []
        })));
    }

    // 12. Teams
    const teamsCount = await Team.countDocuments();
    if (teamsCount === 0) {
        console.log('🌱 Seeding initial Teams...');
        for (const t of INITIAL_TEAMS) {
            try {
                await Team.create({
                    name: t.name,
                    shortCode: t.shortCode || '',
                    captainName: t.captainName,
                    captainPhone: t.captainPhone,
                    homeColor: t.homeColor || '#10b981',
                    area: t.area || 'Uttara, Dhaka',
                    stats: t.stats || {},
                    players: t.players || []
                });
            } catch (err) {
                console.warn('Team seed error:', err.message);
            }
        }
    }
}
