import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('q');

        const includeDisabled = searchParams.get('includeDisabled') === '1' || searchParams.get('all') === '1';
        const query = includeDisabled ? {} : { disabled: false };
        if (role) {
            query.role = role;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(includeDisabled ? 500 : 50);

        return NextResponse.json({
            success: true,
            count: users.length,
            users: users.map(u => u.toJSON())
        }, { status: 200 });
    }
    catch (err) {
        console.error('Users API error:', err);
        return NextResponse.json(
            { error: err.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
