import React, { useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { AppText, Heading, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { parseGatewayReturn } from './paymentResult';

/**
 * The hosted SSLCommerz checkout inside the app.
 *
 * The gateway finishes by redirecting to the website's `/booking?payment=…` page. That navigation
 * is intercepted (never loaded) and reported through `onReturn({ payment, bookingCode, tranId, reason })`.
 *   url: gateway session URL          webRef: ref to the WebView (for goBack / reload)
 *   onCanGoBack(bool): whether the WebView has history to go back to
 */
export function GatewayWebView({ url, webRef, onReturn, onCanGoBack }) {
    const [loading, setLoading] = useState(true);
    const [firstLoad, setFirstLoad] = useState(true);
    const [progress, setProgress] = useState(0);
    const [loadError, setLoadError] = useState('');
    const handled = useRef(false);

    /** True when `navUrl` is the return to the site (handled once). */
    const intercept = (navUrl) => {
        const result = parseGatewayReturn(navUrl);
        if (!result) return false;
        if (!handled.current) {
            handled.current = true;
            onReturn(result);
        }
        return true;
    };

    const reload = () => {
        setLoadError('');
        setLoading(true);
        if (webRef?.current) webRef.current.reload();
    };

    return (
        <View style={styles.root}>
            <WebView
                ref={webRef}
                source={{ uri: url }}
                style={styles.web}
                javaScriptEnabled
                domStorageEnabled
                thirdPartyCookiesEnabled
                sharedCookiesEnabled
                setSupportMultipleWindows={false}
                onShouldStartLoadWithRequest={(request) => !intercept(request.url)}
                onNavigationStateChange={(nav) => {
                    if (onCanGoBack) onCanGoBack(!!nav.canGoBack);
                    intercept(nav.url);
                }}
                onLoadStart={() => { setLoading(true); setProgress(0); }}
                onLoadProgress={({ nativeEvent }) => setProgress(Number(nativeEvent?.progress) || 0)}
                onLoadEnd={() => { setLoading(false); setFirstLoad(false); }}
                onError={({ nativeEvent }) => {
                    setLoading(false);
                    setFirstLoad(false);
                    setLoadError(String(nativeEvent?.description || 'The payment page could not be loaded.'));
                }}
            />

            {loading ? (
                <View style={styles.progressTrack} pointerEvents="none">
                    <View style={[styles.progressBar, { width: `${Math.max(8, Math.round(progress * 100))}%` }]} />
                </View>
            ) : null}

            {loading && firstLoad && !loadError ? (
                <View style={styles.overlay} pointerEvents="none">
                    <ActivityIndicator size="large" color={colors.brand} />
                    <AppText size="sm" tone="muted" center>Opening the SSLCommerz secure checkout…</AppText>
                </View>
            ) : null}

            {loadError ? (
                <View style={styles.overlay}>
                    <WifiOff size={30} color={colors.textDim} />
                    <Heading level={4} center>The payment page did not load</Heading>
                    <AppText size="sm" tone="muted" center>{`${loadError} Check your connection and try again.`}</AppText>
                    <Button title="Reload" icon={RefreshCw} onPress={reload} />
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.white },
    web: { flex: 1, backgroundColor: colors.white },
    progressTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.glassStrong },
    progressBar: { height: 3, backgroundColor: colors.brand },
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl, backgroundColor: colors.bg }
});
