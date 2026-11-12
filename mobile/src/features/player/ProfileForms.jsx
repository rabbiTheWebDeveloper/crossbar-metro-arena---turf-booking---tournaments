import React, { useEffect, useState } from 'react';
import { User, Mail, Lock } from 'lucide-react-native';
import { useArena } from '@/context/ArenaContext';
import { Input, Select, Button, Notice, Sheet } from '@/components/ui';
import { fonts } from '@/theme';
import { POSITION_OPTIONS } from './constants';

/**
 * Edit name / e-mail (and playing position for players). The mobile number is the login and
 * links the bookings, so it is read-only.
 *   showPosition: include the playing position (player accounts)
 */
export function ProfileForm({ showPosition = true }) {
    const { currentUser, siteSettings, handleUpdateProfile } = useArena();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [position, setPosition] = useState('MID');
    const [message, setMessage] = useState(null); // { type, text }
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setName(currentUser?.name || '');
        setEmail(currentUser?.email || '');
        setPosition(currentUser?.playingPosition || 'MID');
    }, [currentUser?.id, currentUser?.name, currentUser?.email, currentUser?.playingPosition]);
    useEffect(() => { setMessage(null); }, [currentUser?.id]);

    const deskPhoneLabel = siteSettings?.phoneFormatted || siteSettings?.phone || '';

    const submit = async () => {
        if (submitting) return;
        setMessage(null);
        const trimmed = name.trim();
        if (trimmed.length < 2) { setMessage({ type: 'error', text: 'Please enter your full name.' }); return; }
        const patch = { name: trimmed, email: email.trim() };
        if (showPosition) patch.playingPosition = position;
        setSubmitting(true);
        const r = await handleUpdateProfile(patch);
        setSubmitting(false);
        setMessage(r?.ok ? { type: 'success', text: 'Profile updated.' } : { type: 'error', text: r?.error || 'Could not update your profile.' });
    };

    return (
        <>
            {message ? <Notice type={message.type} message={message.text} /> : null}
            <Input label="Full Name" icon={User} value={name} onChangeText={setName} maxLength={60} autoCapitalize="words" autoComplete="name" />
            <Input label="Email Address" icon={Mail} type="email" value={email} onChangeText={setEmail} autoComplete="email" />
            {showPosition ? (
                <Select label="Playing Position" title="Playing position" value={position} onChange={setPosition} options={POSITION_OPTIONS} />
            ) : null}
            <Input
                label="Registered Mobile"
                value={currentUser?.phone || ''}
                editable={false}
                inputStyle={{ fontFamily: fonts.mono }}
                hint={`Your mobile number is your login and links your bookings. Contact the arena desk${deskPhoneLabel ? ` (${deskPhoneLabel})` : ''} to change it.`}
            />
            <Button title={submitting ? 'Saving…' : 'Save Profile Changes'} block loading={submitting} onPress={submit} />
        </>
    );
}

/** Change password: current password + new password twice. */
export function PasswordForm() {
    const { handleChangePassword } = useArena();
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirmNext, setConfirmNext] = useState('');
    const [message, setMessage] = useState(null); // { type, text }
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (submitting) return;
        setMessage(null);
        if (!current) { setMessage({ type: 'error', text: 'Enter your current password.' }); return; }
        if (next.length < 6) { setMessage({ type: 'error', text: 'New password must be at least 6 characters.' }); return; }
        if (next !== confirmNext) { setMessage({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
        setSubmitting(true);
        const r = await handleChangePassword(current, next);
        setSubmitting(false);
        if (!r?.ok) { setMessage({ type: 'error', text: r?.error || 'Could not change the password.' }); return; }
        setMessage({ type: 'success', text: 'Password changed.' });
        setCurrent('');
        setNext('');
        setConfirmNext('');
    };

    return (
        <>
            {message ? <Notice type={message.type} message={message.text} /> : null}
            <Input label="Current Password" icon={Lock} secure value={current} onChangeText={setCurrent} autoComplete="current-password" />
            <Input label="New Password" icon={Lock} secure placeholder="Min 6 characters" value={next} onChangeText={setNext} autoComplete="new-password" />
            <Input label="Confirm New Password" icon={Lock} secure value={confirmNext} onChangeText={setConfirmNext} autoComplete="new-password" />
            <Button title={submitting ? 'Updating…' : 'Update Password'} variant="secondary" block loading={submitting} onPress={submit} />
        </>
    );
}

/** The profile form in a sheet (used on the admin / investor account screen). */
export function ProfileSheet({ visible, onClose, showPosition }) {
    return (
        <Sheet visible={visible} onClose={onClose} title="Edit profile" icon={User}>
            {visible ? <ProfileForm showPosition={showPosition} /> : null}
        </Sheet>
    );
}

/** The change-password form in a sheet. */
export function PasswordSheet({ visible, onClose }) {
    return (
        <Sheet visible={visible} onClose={onClose} title="Change password" icon={Lock}>
            {visible ? <PasswordForm /> : null}
        </Sheet>
    );
}
