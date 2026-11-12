import React, { useEffect, useMemo, useState } from 'react';
import { Camera } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Sheet, Input, Select, ToggleRow, Button, Notice, Row } from '@/components/ui';
import { ImageUrlField, HTTPS_URL_RE } from '../content/ImageUrlField';
import { SuggestInput } from '../content/SuggestInput';
import { ALBUMS, ASPECTS, emptyPhotoForm, photoToForm, buildPhotoPayload } from './helpers';

/**
 * Add / edit a gallery photo. Photos are added by public https image URL (no file upload),
 * exactly like the website.
 *   photo: the photo being edited, or null to add a new one
 *   existingAlbums: album names already used in the gallery (offered as suggestions)
 */
export function PhotoFormSheet({ visible, onClose, photo, existingAlbums = [] }) {
    const { handleSavePhoto, showNotice } = useArena();
    const [form, setForm] = useState(emptyPhotoForm());
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const editing = photo || null;

    const albumOptions = useMemo(() => Array.from(new Set([...ALBUMS, ...existingAlbums])), [existingAlbums]);

    // Load the form each time the sheet opens
    useEffect(() => {
        if (!visible) return;
        setForm(photo ? photoToForm(photo) : emptyPhotoForm());
        setError('');
        setSubmitting(false);
    }, [visible, photo]);

    const close = () => { if (!submitting) onClose(); };

    const submit = async () => {
        if (submitting) return;
        setError('');
        const built = buildPhotoPayload(form, editing);
        if (built.error) { setError(built.error); return; }
        setSubmitting(true);
        const res = await handleSavePhoto(built.payload);
        setSubmitting(false);
        if (res?.ok && res.photo) {
            showNotice('success', editing ? 'Photo updated' : `"${res.photo.title}" added to the gallery`);
            onClose();
        } else {
            setError(res?.error || 'Could not save the photo.');
        }
    };

    return (
        <Sheet
            visible={visible}
            onClose={close}
            dismissable={!submitting}
            title={editing ? 'Edit Photo' : 'Add Photo'}
            subtitle="Paste a public image URL. Host images on ImageKit, Cloudinary or similar first."
            icon={Camera}
            footer={(
                <>
                    {error ? <Notice type="error" message={error} /> : null}
                    <Row>
                        <Button title="Cancel" variant="secondary" disabled={submitting} onPress={close} style={{ flex: 1 }} />
                        <Button title={submitting ? 'Saving…' : (editing ? 'Save Changes' : 'Add to Gallery')} loading={submitting} onPress={submit} style={{ flex: 1.4 }} />
                    </Row>
                </>
            )}
        >
            <ImageUrlField
                label="Image URL (https)"
                required
                value={form.url}
                onChangeText={v => set('url', v)}
                placeholder="https://ik.imagekit.io/... or https://res.cloudinary.com/..."
                hint="Direct file uploads are not supported here. Upload to your image host, then paste the public https link."
                pattern={HTTPS_URL_RE}
            />

            <Input label="Photo Title" required value={form.title} onChangeText={v => set('title', v)} placeholder="e.g. Friday night 7v7 final" />
            <SuggestInput label="Album" required value={form.album} onChangeText={v => set('album', v)} options={albumOptions} />
            <Select label="Aspect Ratio" value={form.aspect} onChange={v => set('aspect', v)} options={ASPECTS} />
            <Input label="Caption" multiline value={form.caption} onChangeText={v => set('caption', v)} placeholder="Short description shown under the photo" inputStyle={{ minHeight: 60 }} />
            <Input label="Photographer / Credit" value={form.photographer} onChangeText={v => set('photographer', v)} placeholder="e.g. Media Desk" autoCapitalize="words" />
            <Input label="Tags (comma separated)" value={form.tags} onChangeText={v => set('tags', v)} placeholder="e.g. NightDerby, SuperCup" autoCapitalize="none" />

            <ToggleRow
                label="Feature on the home page"
                description="Featured photos appear in the public highlights reel."
                value={form.featured}
                onValueChange={v => set('featured', v)}
            />
        </Sheet>
    );
}
