import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { GalleryPhoto } from '@/models/GalleryPhoto';

export async function DELETE(_request, { params }) {
    try {
        await connectToDatabase();
        const { id } = await params;
        await GalleryPhoto.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Photo deleted from gallery' });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
