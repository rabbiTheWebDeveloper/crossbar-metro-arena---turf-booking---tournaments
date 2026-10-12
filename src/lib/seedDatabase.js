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

    // 1. Settings & Slot Pricing Configuration (System venue configuration)
    const settingsCount = await Setting.countDocuments();
    if (settingsCount === 0) {
        console.log('🌱 Initializing Arena Settings & Slot Definitions...');
        await Setting.create({ slotPrices: SCHEDULE_SLOTS_DEFINITION });
    }
}

