import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Input, AppText, Label } from '@/components/ui';
import { absoluteUrl } from '@/lib/api';
import { colors, radius, spacing, fonts, fontSize } from '@/theme';

/** Same rules as the website forms. */
export const HTTP_URL_RE = /^https?:\/\//i; // tournaments, products
export const HTTPS_URL_RE = /^https:\/\/[^\s]+$/i; // gallery (public https links only)

/**
 * Image URL input with a live preview. The website does not upload files: the admin pastes a
 * public link (ImageKit / Cloudinary / …) and so does the app.
 *   pattern: the link must match it before the preview is attempted
 *   aspectRatio: shape of the preview frame
 */
export function ImageUrlField({ label, value, onChangeText, placeholder, hint, required, pattern = HTTP_URL_RE, aspectRatio = 16 / 9 }) {
    const url = String(value || '').trim();
    const [failedUrl, setFailedUrl] = useState(null);
    const failed = !pattern.test(url) || failedUrl === url;

    return (
        <View style={{ gap: spacing.sm }}>
            <Input
                label={label}
                required={required}
                type="url"
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                hint={hint}
                inputStyle={{ fontFamily: fonts.mono, fontSize: fontSize.sm }}
            />
            {url ? (
                <View style={styles.box}>
                    <Label>Preview</Label>
                    <View style={[styles.frame, { aspectRatio }]}>
                        {failed ? (
                            <AppText size="xs" tone="danger" center style={{ paddingHorizontal: spacing.md }}>
                                Could not load this image. Check the URL is public.
                            </AppText>
                        ) : (
                            <Image
                                source={{ uri: absoluteUrl(url) }}
                                style={styles.image}
                                contentFit="cover"
                                transition={150}
                                onError={() => setFailedUrl(url)}
                            />
                        )}
                    </View>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    box: { gap: 6, padding: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDeep },
    frame: { width: '100%', borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    image: { width: '100%', height: '100%' }
});
