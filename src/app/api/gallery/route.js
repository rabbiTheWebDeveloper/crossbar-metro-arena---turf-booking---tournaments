import { NextResponse } from 'next/server';
import { requireAdmin, isObjectId } from '@/lib/apiAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { GalleryPhoto } from '@/models/GalleryPhoto';
import { readJson, validate, badRequest, errorResponse } from '@/lib/validate';
import { GALLERY_SCHEMA } from '@/lib/schemas';

export async function GET(request) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const album = searchParams.get('album');

        const query = {};
        if (album && album !== 'All') query.album = String(album);

        const photos = await GalleryPhoto.find(query).sort({ createdAt: -1 });
        return NextResponse.json({
            success: true,
            count: photos.length,
            galleryPhotos: photos.map(p => p.toJSON())
        });
    } catch (err) {
        return errorResponse(err, 'GET /api/gallery');
    }
}

/** POST adds a photo, or updates it when the body carries an existing id (used by the admin editor). */
export async function POST(request) {
    try {
        const { denied } = await requireAdmin(request);
        if (denied) return denied;
        const { body, error: jsonError } = await readJson(request);
        if (jsonError) return jsonError;

        const targetId = body.id || body._id;
        if (targetId && !isObjectId(targetId)) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

        await connectToDatabase();
        const existing = targetId ? await GalleryPhoto.findById(targetId) : null;
        if (targetId && !existing) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });

        const { data, error } = validate(body, GALLERY_SCHEMA, { partial: Boolean(existing) });
        if (error) return badRequest(error);

        if (existing) {
            existing.set(data);
            await existing.save();
            return NextResponse.json({ success: true, message: 'Gallery photo updated successfully', photo: existing.toJSON() });
        }

        const photo = new GalleryPhoto({ ...data, uploadedAt: new Date().toISOString().split('T')[0] });
        await photo.save();

        return NextResponse.json({
            success: true,
            message: 'Gallery photo added successfully',
            photo: photo.toJSON()
        }, { status: 201 });
    } catch (err) {
        return errorResponse(err, 'POST /api/gallery');
    }
}
