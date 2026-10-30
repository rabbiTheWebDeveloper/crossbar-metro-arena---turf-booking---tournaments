import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { GalleryPhoto } from '@/models/GalleryPhoto';

export async function DELETE(request, { params }) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const { id } = await params;
        if (!isObjectId(id)) return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        await GalleryPhoto.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Photo deleted from gallery' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
