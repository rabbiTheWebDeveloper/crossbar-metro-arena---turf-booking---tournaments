import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';

export async function GET(request) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const search = searchParams.get('q');

        const query = { disabled: false };
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
            .limit(50);

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
