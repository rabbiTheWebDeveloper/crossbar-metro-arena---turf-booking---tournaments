import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { GalleryPhoto } from '@/models/GalleryPhoto';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const album = searchParams.get('album');

        const query = {};
        if (album && album !== 'All') query.album = album;

        const photos = await GalleryPhoto.find(query).sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: photos.length,
            galleryPhotos: photos.map(p => p.toJSON())
        });
    } catch (err) {
        console.error('GET /api/gallery error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        await connectToDatabase();
        const body = await request.json();
        const targetId = body.id || body._id;

        if (targetId) {
            const existing = await GalleryPhoto.findById(targetId);
            if (existing) {
                if (body.title) existing.title = body.title.trim();
                if (body.url) existing.url = body.url.trim();
                if (body.album) existing.album = body.album.trim();
                if (body.caption !== undefined) existing.caption = body.caption.trim();
                if (body.photographer) existing.photographer = body.photographer.trim();
                if (body.featured !== undefined) existing.featured = !!body.featured;
                if (body.aspect) existing.aspect = body.aspect;
                if (body.tags) existing.tags = body.tags;
                await existing.save();
                return NextResponse.json({
                    success: true,
                    message: 'Gallery photo updated successfully',
                    photo: existing.toJSON()
                });
            }
        }

        const { title, url, album, caption, photographer } = body;

        if (!title || !url) {
            return NextResponse.json({ error: 'Title and Image URL are required.' }, { status: 400 });
        }

        const newPhoto = new GalleryPhoto({
            title: title.trim(),
            url: url.trim(),
            album: album || 'Arena',
            caption: caption || '',
            photographer: photographer || 'Media Desk',
            featured: body.featured ?? false,
            aspect: body.aspect || 'wide',
            uploadedAt: new Date().toISOString().split('T')[0],
            tags: body.tags || []
        });

        await newPhoto.save();

        return NextResponse.json({
            success: true,
            message: 'Gallery photo added successfully',
            photo: newPhoto.toJSON()
        }, { status: 201 });
    } catch (err) {
        console.error('POST /api/gallery error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
