import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { errorResponse } from '@/lib/validate';
import { syncCustomersFromAllModels } from '@/lib/customers';

/**
 * POST /api/customers/sync  (admin, or staff with the "players" permission)
 * Adds everyone found in player accounts, bookings, fixed slots, tournament registrations, shop orders and team
 * captains who is not in the customer list yet, and fills in blank details for the ones that are. Never overwrites
 * anything staff typed, so it is safe to run as often as needed.
 */
export async function POST(request) {
    try {
        const { user: actor, denied } = await requirePermission(request, 'players');
        if (denied) return denied;
        await connectToDatabase();

        const result = await syncCustomersFromAllModels(actor);
        const message = result.created || result.updated
            ? `Customer list updated: ${result.created} added, ${result.updated} refreshed.`
            : 'The customer list is already up to date.';
        return NextResponse.json({ success: true, message, ...result });
    } catch (err) {
        return errorResponse(err, 'POST /api/customers/sync');
    }
}
