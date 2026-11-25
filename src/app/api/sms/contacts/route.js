import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Customer } from '@/models/customer-model';
import { User } from '@/models/user-model';
import { Investor } from '@/models/investor-model';
import { Booking } from '@/models/booking-model';
import { requirePermission } from '@/lib/apiAuth';
import { cleanPhone, isValidBdPhone } from '@/lib/phone';
import { todayDhaka } from '@/lib/booking';
import { errorResponse } from '@/lib/validate';

const ACTIVE_BOOKING_STATUSES = ['confirmed_unpaid', 'paid_advance', 'paid_full'];

/**
 * GET /api/sms/contacts
 * Returns deduplicated contact directory (Customers, Registered Users, Investors, Today's Match Captains)
 * and exact audience group counts for the Admin Bulk & Manual SMS composer.
 */
export async function GET(request) {
    try {
        const { denied } = await requirePermission(request, ['players', 'bookings', 'settings']);
        if (denied) return denied;

        await connectToDatabase();
        const today = todayDhaka();

        const [customers, users, investors, bookingStats, todayBookings] = await Promise.all([
            Customer.find()
                .select('name phone email sources area lastActivityAt')
                .sort({ lastActivityAt: -1 })
                .limit(2000)
                .lean(),
            User.find({ disabled: { $ne: true } })
                .select('name phone email role playingPosition createdAt')
                .sort({ createdAt: -1 })
                .limit(2000)
                .lean(),
            Investor.find()
                .select('name phone email status sharePercentage')
                .sort({ createdAt: -1 })
                .lean(),
            Booking.aggregate([
                { $match: { paymentStatus: { $in: ACTIVE_BOOKING_STATUSES } } },
                {
                    $group: {
                        _id: '$captainPhone',
                        count: { $sum: 1 },
                        captainName: { $first: '$captainName' },
                        teamName: { $first: '$teamName' },
                        lastDate: { $max: '$date' }
                    }
                }
            ]),
            Booking.find({
                date: today,
                paymentStatus: { $in: ACTIVE_BOOKING_STATUSES }
            })
                .select('captainName captainPhone teamName displayTime')
                .lean()
        ]);

        // Audience phone sets (deduplicated 11-digit BD numbers)
        const setAllCustomers = new Set();
        const setBookedCustomers = new Set();
        const setRepeatCustomers = new Set();
        const setTodayCaptains = new Set();
        const setAllPlayers = new Set();
        const setActiveInvestors = new Set();
        const setStaffAdmins = new Set();

        // Unified directory keyed by 11-digit phone
        const byPhone = new Map();
        const upsert = (rawPhone, patch) => {
            const phone = cleanPhone(rawPhone);
            if (!isValidBdPhone(phone)) return null;
            const prev = byPhone.get(phone) || {
                phone,
                name: '',
                email: '',
                teamName: '',
                groups: [],
                role: '',
                bookingCount: 0,
                isTodayCaptain: false,
                todaySlot: ''
            };
            const groups = new Set(prev.groups);
            if (patch.group) groups.add(patch.group);
            const next = {
                ...prev,
                name: prev.name || patch.name || '',
                email: prev.email || patch.email || '',
                teamName: prev.teamName || patch.teamName || '',
                role: patch.role || prev.role,
                bookingCount: Math.max(prev.bookingCount, patch.bookingCount || 0),
                isTodayCaptain: prev.isTodayCaptain || Boolean(patch.isTodayCaptain),
                todaySlot: prev.todaySlot || patch.todaySlot || '',
                groups: [...groups]
            };
            byPhone.set(phone, next);
            return phone;
        };

        for (const c of customers) {
            const p = upsert(c.phone, {
                name: c.name,
                email: c.email,
                group: 'customer'
            });
            if (p) setAllCustomers.add(p);
        }

        for (const b of bookingStats) {
            const count = Number(b.count) || 0;
            const p = upsert(b._id, {
                name: b.captainName,
                teamName: b.teamName,
                bookingCount: count,
                group: 'customer'
            });
            if (p) {
                if (count >= 1) setBookedCustomers.add(p);
                if (count >= 2) setRepeatCustomers.add(p);
            }
        }

        for (const tb of todayBookings) {
            const p = upsert(tb.captainPhone, {
                name: tb.captainName,
                teamName: tb.teamName,
                isTodayCaptain: true,
                todaySlot: tb.displayTime || '',
                group: 'today'
            });
            if (p) setTodayCaptains.add(p);
        }

        for (const u of users) {
            const role = u.role || 'player';
            const p = upsert(u.phone, {
                name: u.name,
                email: u.email,
                role,
                group: role === 'player' ? 'player' : (role === 'investor' ? 'investor' : 'staff')
            });
            if (p) {
                if (role === 'player') setAllPlayers.add(p);
                if (role === 'staff' || role === 'admin') setStaffAdmins.add(p);
            }
        }

        for (const inv of investors) {
            const p = upsert(inv.phone, {
                name: inv.name,
                email: inv.email,
                role: 'investor',
                group: 'investor'
            });
            if (p && inv.status === 'active') {
                setActiveInvestors.add(p);
            }
        }

        const contacts = [...byPhone.values()].sort((a, b) => {
            if (a.isTodayCaptain !== b.isTodayCaptain) return a.isTodayCaptain ? -1 : 1;
            if (b.bookingCount !== a.bookingCount) return b.bookingCount - a.bookingCount;
            return (a.name || '').localeCompare(b.name || '');
        });

        const audiences = [
            {
                key: 'all_customers',
                label: 'All Customers',
                description: 'Everyone in the CRM customer directory',
                count: setAllCustomers.size,
                phones: [...setAllCustomers]
            },
            {
                key: 'booked_customers',
                label: 'Booked Customers',
                description: 'Captains with at least 1 confirmed match',
                count: setBookedCustomers.size,
                phones: [...setBookedCustomers]
            },
            {
                key: 'repeat_customers',
                label: 'Repeat Customers (2+)',
                description: 'Captains with 2 or more turf bookings',
                count: setRepeatCustomers.size,
                phones: [...setRepeatCustomers]
            },
            {
                key: 'today_captains',
                label: "Today's Match Captains",
                description: `Active bookings scheduled on ${today}`,
                count: setTodayCaptains.size,
                phones: [...setTodayCaptains]
            },
            {
                key: 'all_players',
                label: 'Registered Players',
                description: 'Active player login accounts',
                count: setAllPlayers.size,
                phones: [...setAllPlayers]
            },
            {
                key: 'active_investors',
                label: 'Active Investors',
                description: 'Active arena partners & investors',
                count: setActiveInvestors.size,
                phones: [...setActiveInvestors]
            },
            {
                key: 'staff_admins',
                label: 'Staff & Admins',
                description: 'Internal staff & admin accounts',
                count: setStaffAdmins.size,
                phones: [...setStaffAdmins]
            }
        ];

        return NextResponse.json({
            success: true,
            today,
            audiences,
            contacts
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/sms/contacts');
    }
}
