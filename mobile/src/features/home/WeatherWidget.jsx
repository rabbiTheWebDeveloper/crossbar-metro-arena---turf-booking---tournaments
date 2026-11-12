import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Sun, Moon, Cloud, CloudRain, CloudLightning, CloudFog, Wind, Droplets, RefreshCw, ShieldCheck, CloudOff } from 'lucide-react-native';
import { Card, AppText, Heading, Label, Mono, Row, Button, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

// Uttara Sector 17, Dhaka (same Open-Meteo request as the website)
const LAT = 23.8762;
const LON = 90.3792;
const API_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,weather_code&timezone=Asia%2FDhaka&forecast_days=2`;
const REFRESH_MS = 15 * 60 * 1000;

/** WMO weather code -> label, icon and pitch condition. */
const interpretWeatherCode = (code, isDay) => {
    if (code === 0) return { text: isDay ? 'Clear sky' : 'Clear night', icon: isDay ? Sun : Moon, pitch: 'dry' };
    if (code === 1 || code === 2) return { text: isDay ? 'Mostly sunny' : 'Mostly clear', icon: isDay ? Sun : Moon, pitch: 'dry' };
    if (code === 3) return { text: 'Overcast', icon: Cloud, pitch: 'dry' };
    if (code >= 45 && code <= 48) return { text: 'Fog / haze', icon: CloudFog, pitch: 'dry' };
    if (code >= 51 && code <= 57) return { text: 'Drizzle', icon: CloudRain, pitch: 'wet' };
    if (code >= 61 && code <= 67) return { text: 'Rain', icon: CloudRain, pitch: 'wet' };
    if (code >= 71 && code <= 77) return { text: 'Snow', icon: Cloud, pitch: 'wet' };
    if (code >= 80 && code <= 82) return { text: 'Rain showers', icon: CloudRain, pitch: 'wet' };
    if (code >= 95) return { text: 'Thunderstorm', icon: CloudLightning, pitch: 'storm' };
    return { text: 'Mixed conditions', icon: Cloud, pitch: 'dry' };
};
const windLabel = (kmh) => (kmh < 6 ? 'Calm' : kmh < 20 ? 'Light breeze' : kmh < 39 ? 'Breezy' : 'Strong wind');
const humidityLabel = (h) => (h < 40 ? 'Dry air' : h < 70 ? 'Comfortable' : 'Humid');
const pitchLabel = (pitch, precipitation) => {
    if (pitch === 'storm') return { text: 'Check before kickoff', tone: 'danger', note: 'Lightning risk' };
    if (pitch === 'wet' || precipitation > 0) return { text: 'Wet but playable', tone: 'info', note: 'Turf drains quickly' };
    return { text: 'Dry', tone: 'brand', note: 'Good conditions' };
};
const formatHour = (isoTime) => {
    const h = parseInt(String(isoTime).split('T')[1]?.split(':')[0] || '0', 10);
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayH}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};
const round = (n, fallback = 0) => {
    const v = Math.round(Number(n));
    return Number.isFinite(v) ? v : fallback;
};

/** Turns the Open-Meteo payload into the view model. Throws when the payload is incomplete. */
function parseWeather(data) {
    const current = data?.current;
    if (!current || typeof current.temperature_2m !== 'number') throw new Error('Weather payload incomplete');
    const isDay = current.is_day === 1;
    const cond = interpretWeatherCode(current.weather_code ?? 0, isDay);

    // Hourly strip: the next 4 hours after the API's own current time (Dhaka time), not the device clock
    const times = data.hourly?.time || [];
    const temps = data.hourly?.temperature_2m || [];
    const pops = data.hourly?.precipitation_probability || [];
    const codes = data.hourly?.weather_code || [];
    const nowPrefix = String(current.time || '').slice(0, 13); // YYYY-MM-DDTHH
    let startIdx = times.findIndex(t => String(t).slice(0, 13) === nowPrefix);
    if (startIdx < 0) startIdx = 0;
    const hourly = [];
    for (let i = startIdx + 1; i < Math.min(startIdx + 5, times.length); i++) {
        hourly.push({ time: formatHour(times[i]), temp: round(temps[i]), pop: round(pops[i]), cond: interpretWeatherCode(codes[i] ?? 0, true) });
    }
    return {
        temperature: round(current.temperature_2m),
        apparentTemperature: round(current.apparent_temperature ?? current.temperature_2m),
        humidity: round(current.relative_humidity_2m),
        windSpeed: round(current.wind_speed_10m),
        precipitation: Number(current.precipitation) || 0,
        isDay,
        cond,
        hourly,
        observedAt: current.time ? String(current.time).replace('T', ' ') : ''
    };
}

/**
 * Live matchday weather for Uttara, Dhaka (Open-Meteo, refreshed every 15 minutes).
 *   onBookSlotClick: optional "Book a slot" shortcut shown above the hourly strip
 */
export function WeatherWidget({ onBookSlotClick }) {
    const [weather, setWeather] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ok | error
    const [refreshing, setRefreshing] = useState(false);
    const mounted = useRef(true);

    const fetchWeather = useCallback(async () => {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Weather API request failed');
            const parsed = parseWeather(await res.json());
            if (!mounted.current) return;
            setWeather(parsed);
            setStatus('ok');
        } catch {
            // Keep showing the last good reading when a refresh fails
            if (mounted.current) setStatus(prev => (prev === 'ok' ? 'ok' : 'error'));
        } finally {
            if (mounted.current) setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchWeather();
        const interval = setInterval(fetchWeather, REFRESH_MS);
        return () => { mounted.current = false; clearInterval(interval); };
    }, [fetchWeather]);

    const handleManualRefresh = () => {
        if (refreshing) return;
        setRefreshing(true);
        fetchWeather();
    };

    if (status === 'loading') {
        return (
            <Card>
                <Row justify="center" gap={spacing.md}>
                    <ActivityIndicator size="small" color={colors.brand} />
                    <AppText size="sm" tone="muted">Loading weather for Uttara, Dhaka...</AppText>
                </Row>
            </Card>
        );
    }

    if (status === 'error' || !weather) {
        return (
            <Card>
                <Row align="flex-start" gap={spacing.md}>
                    <CloudOff size={22} color={colors.textDim} />
                    <View style={{ flex: 1, gap: 2 }}>
                        <AppText size="md" weight="800">Weather unavailable</AppText>
                        <AppText size="sm" tone="muted">The forecast service could not be reached. The turf is open as usual; check back in a moment.</AppText>
                    </View>
                </Row>
                <Button title="Retry" variant="secondary" size="sm" icon={RefreshCw} loading={refreshing} onPress={handleManualRefresh} style={{ alignSelf: 'flex-start', marginTop: spacing.md }} />
            </Card>
        );
    }

    const w = weather;
    const Icon = w.cond.icon;
    const iconColor = w.cond.pitch === 'dry' ? (w.isDay ? colors.warning : colors.brand) : colors.info;
    const pitch = pitchLabel(w.cond.pitch, w.precipitation);

    return (
        <Card tone="brand">
            <Row justify="space-between" align="center">
                <Row gap={spacing.md} style={{ flex: 1 }}>
                    <View style={styles.condIcon}>
                        <Icon size={18} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Heading level={4} upper>Uttara, Dhaka weather</Heading>
                        <AppText size="xs" tone="muted">{`${w.observedAt ? `Observed ${w.observedAt} (Dhaka time)` : 'Current conditions'} · Open-Meteo`}</AppText>
                    </View>
                </Row>
                {refreshing
                    ? <View style={styles.refreshBusy}><ActivityIndicator size="small" color={colors.brand} /></View>
                    : <IconButton icon={RefreshCw} tone={colors.brand} size={34} iconSize={15} onPress={handleManualRefresh} accessibilityLabel="Refresh weather" />}
            </Row>

            <Row gap={spacing.lg} style={styles.now}>
                <Row gap={2} align="flex-start">
                    <Heading level={1} style={styles.temp}>{String(w.temperature)}</Heading>
                    <Mono size="lg" tone="brand" style={{ marginTop: 4 }}>°C</Mono>
                </Row>
                <View style={{ flex: 1 }}>
                    <AppText size="md" weight="800">{w.cond.text}</AppText>
                    <AppText size="sm" tone="muted">{`Feels like ${w.apparentTemperature}°C`}</AppText>
                </View>
            </Row>

            <Row gap={spacing.sm} align="stretch">
                <View style={styles.tile}>
                    <Row gap={4} justify="center">
                        <Wind size={12} color={colors.info} />
                        <Label>Wind</Label>
                    </Row>
                    <Mono size="md" style={styles.tileValue}>{`${w.windSpeed} km/h`}</Mono>
                    <AppText size="xxs" tone="muted" center>{windLabel(w.windSpeed)}</AppText>
                </View>
                <View style={styles.tile}>
                    <Row gap={4} justify="center">
                        <Droplets size={12} color={colors.brand} />
                        <Label>Humidity</Label>
                    </Row>
                    <Mono size="md" style={styles.tileValue}>{`${w.humidity}%`}</Mono>
                    <AppText size="xxs" tone="muted" center>{humidityLabel(w.humidity)}</AppText>
                </View>
                <View style={styles.tile}>
                    <Row gap={4} justify="center">
                        <ShieldCheck size={12} color={colors.brand} />
                        <Label>Pitch</Label>
                    </Row>
                    <AppText size="sm" weight="800" tone={pitch.tone} center style={styles.tileValue}>{pitch.text}</AppText>
                    <AppText size="xxs" tone="muted" center>{pitch.note}</AppText>
                </View>
            </Row>

            {w.hourly.length > 0 ? (
                <View style={styles.hourly}>
                    <Row justify="space-between">
                        <Label>Next hours (Dhaka time)</Label>
                        {onBookSlotClick ? (
                            <Pressable onPress={onBookSlotClick} hitSlop={8}>
                                <AppText size="xs" tone="brand" weight="700">Book a slot →</AppText>
                            </Pressable>
                        ) : null}
                    </Row>
                    <View style={styles.hourGrid}>
                        {w.hourly.map((h) => (
                            <View key={h.time} style={styles.hour}>
                                <View>
                                    <Mono size="xs" tone="muted" weight="600">{h.time}</Mono>
                                    <AppText size="sm" weight="800">{`${h.temp}°C`}</AppText>
                                </View>
                                <AppText size="xs" weight="700" tone={h.pop >= 40 ? 'info' : 'brand'} style={{ flexShrink: 1, textAlign: 'right' }} numberOfLines={2}>
                                    {h.pop >= 20 ? `${h.pop}% rain` : h.cond.text}
                                </AppText>
                            </View>
                        ))}
                    </View>
                </View>
            ) : null}
        </Card>
    );
}

const styles = StyleSheet.create({
    condIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.borderBrand, alignItems: 'center', justifyContent: 'center' },
    refreshBusy: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    now: { marginVertical: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
    temp: { fontSize: 44, lineHeight: 50 },
    tile: { flex: 1, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass, gap: 2 },
    tileValue: { textAlign: 'center', marginTop: 2 },
    hourly: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
    hourGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    hour: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass }
});
