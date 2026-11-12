import React, { useMemo, useState } from 'react';
import { View, TextInput, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, Check, Calendar, Eye, EyeOff, Minus, Plus, Search } from 'lucide-react-native';
import { colors, radius, spacing, fontSize } from '../../theme';
import { AppText, Label } from './Typography';
import { Row } from './Layout';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { MONTH_NAMES, SHORT_DAYS, parseLocalDate, toIsoLocal, formatIsoDate, todayDhakaIso, isIsoDate, formatMonth, shiftMonth } from '../../lib/dateUtils';

/** Label + control + hint/error wrapper. */
export function Field({ label, hint, error, required, children, style }) {
    return (
        <View style={[{ gap: 6 }, style]}>
            {label ? (
                <Label tone="soft">
                    {label}{required ? ' *' : ''}
                </Label>
            ) : null}
            {children}
            {error ? <AppText size="xs" tone="danger">{error}</AppText> : (hint ? <AppText size="xs" tone="dim">{hint}</AppText> : null)}
        </View>
    );
}

/**
 * Text input.
 *   label / hint / error / required: rendered by Field
 *   icon: leading lucide icon      secure: password field with show/hide toggle
 *   type: 'text' | 'number' | 'phone' | 'email' | 'url'      multiline: text area
 */
export function Input({ label, hint, error, required, icon: Icon, secure, type = 'text', multiline, value, onChangeText, style, inputStyle, right, editable = true, ...rest }) {
    const [hidden, setHidden] = useState(true);
    const [focused, setFocused] = useState(false);
    const keyboardType = { number: 'numeric', phone: 'phone-pad', email: 'email-address', url: 'url' }[type] || 'default';
    return (
        <Field label={label} hint={hint} error={error} required={required} style={style}>
            <View style={[styles.inputWrap, focused ? { borderColor: colors.brand } : null, error ? { borderColor: colors.danger } : null, !editable ? { opacity: 0.6 } : null, multiline ? { alignItems: 'flex-start' } : null]}>
                {Icon ? <Icon size={16} color={colors.textDim} style={multiline ? { marginTop: 13 } : null} /> : null}
                <TextInput
                    placeholderTextColor={colors.textDim}
                    selectionColor={colors.brand}
                    cursorColor={colors.brand}
                    autoCapitalize={type === 'email' || type === 'url' || secure ? 'none' : 'sentences'}
                    autoCorrect={false}
                    keyboardType={keyboardType}
                    {...rest}
                    editable={editable}
                    value={value === null || value === undefined ? '' : String(value)}
                    onChangeText={onChangeText}
                    secureTextEntry={!!secure && hidden}
                    multiline={!!multiline}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    onFocus={(e) => { setFocused(true); if (rest.onFocus) rest.onFocus(e); }}
                    onBlur={(e) => { setFocused(false); if (rest.onBlur) rest.onBlur(e); }}
                    style={[styles.input, multiline ? { minHeight: 84, paddingTop: 11 } : null, inputStyle]}
                />
                {secure ? (
                    <Pressable onPress={() => setHidden(h => !h)} hitSlop={10} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
                        {hidden ? <Eye size={17} color={colors.textDim} /> : <EyeOff size={17} color={colors.textDim} />}
                    </Pressable>
                ) : null}
                {right}
            </View>
        </Field>
    );
}

/** Search box. */
export function SearchInput({ value, onChangeText, placeholder = 'Search…', style }) {
    return <Input icon={Search} value={value} onChangeText={onChangeText} placeholder={placeholder} autoCapitalize="none" returnKeyType="search" style={style} />;
}

/**
 * Dropdown replacement: opens a sheet listing the options.
 *   options: [{ value, label, description? }] or plain strings
 */
export function Select({ label, hint, error, required, value, onChange, options = [], placeholder = 'Select…', title, disabled, style, searchable }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const list = useMemo(() => options.map(o => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) })), [options]);
    const selected = list.find(o => o.value === value);
    const shown = searchable && query ? list.filter(o => String(o.label).toLowerCase().includes(query.toLowerCase())) : list;
    return (
        <Field label={label} hint={hint} error={error} required={required} style={style}>
            <Pressable onPress={() => !disabled && setOpen(true)} style={[styles.inputWrap, { paddingVertical: 12 }, disabled ? { opacity: 0.5 } : null]} accessibilityRole="button">
                <AppText size="md" tone={selected ? 'default' : 'dim'} style={{ flex: 1 }} numberOfLines={1}>{selected ? selected.label : placeholder}</AppText>
                <ChevronDown size={16} color={colors.textDim} />
            </Pressable>
            <Sheet visible={open} onClose={() => setOpen(false)} title={title || label || 'Select'} scroll={false}>
                {searchable ? <SearchInput value={query} onChangeText={setQuery} /> : null}
                <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
                    {shown.map(o => {
                        const active = o.value === value;
                        return (
                            <Pressable key={String(o.value)} onPress={() => { onChange(o.value); setOpen(false); setQuery(''); }} style={[styles.option, active ? { backgroundColor: colors.brandSoft, borderColor: colors.borderBrand } : null]}>
                                <View style={{ flex: 1 }}>
                                    <AppText size="md" weight={active ? '800' : '600'} tone={active ? 'brand' : 'default'}>{o.label}</AppText>
                                    {o.description ? <AppText size="xs" tone="muted">{o.description}</AppText> : null}
                                </View>
                                {active ? <Check size={16} color={colors.brand} /> : null}
                            </Pressable>
                        );
                    })}
                    {shown.length === 0 ? <AppText size="sm" tone="muted" center style={{ padding: spacing.lg }}>No options</AppText> : null}
                </ScrollView>
            </Sheet>
        </Field>
    );
}

/** Horizontal segmented control. options: [{ value, label, icon?, badge? }] or strings. */
export function Segmented({ value, onChange, options = [], scroll, size = 'md', style }) {
    const list = options.map(o => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) }));
    const items = list.map(o => {
        const active = o.value === value;
        const Icon = o.icon;
        return (
            <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.segment, size === 'sm' ? { paddingVertical: 6, paddingHorizontal: 10 } : null, active ? styles.segmentActive : null, scroll ? null : { flex: 1 }]}>
                {Icon ? <Icon size={14} color={active ? colors.onBrand : colors.textMuted} strokeWidth={2.4} /> : null}
                <AppText size={size === 'sm' ? 'xs' : 'sm'} weight="800" style={{ color: active ? colors.onBrand : colors.textMuted }} numberOfLines={1}>{o.label}</AppText>
                {o.badge ? (
                    <View style={[styles.segBadge, active ? { backgroundColor: colors.onBrand } : null]}>
                        <AppText size={9} weight="900" style={{ color: active ? colors.brand : colors.onBrand, lineHeight: 12 }}>{String(o.badge)}</AppText>
                    </View>
                ) : null}
            </Pressable>
        );
    });
    if (scroll) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ flexGrow: 0 }, style]} contentContainerStyle={{ gap: 6, paddingRight: spacing.sm }}>
                {items}
            </ScrollView>
        );
    }
    return <View style={[styles.segmented, style]}>{items}</View>;
}

/** Toggleable pill (filters, multi-select tags). */
export function Chip({ label, selected, onPress, icon: Icon, tone = 'brand', style }) {
    const activeColor = tone === 'brand' ? colors.brand : tone;
    return (
        <Pressable onPress={onPress} style={[styles.chip, selected ? { backgroundColor: colors.brandSoft, borderColor: activeColor } : null, style]}>
            {Icon ? <Icon size={13} color={selected ? activeColor : colors.textMuted} /> : null}
            <AppText size="xs" weight="800" style={{ color: selected ? activeColor : colors.textMuted }}>{label}</AppText>
        </Pressable>
    );
}

/** Checkbox row. */
export function Checkbox({ label, description, checked, onChange, right, style }) {
    return (
        <Pressable onPress={() => onChange(!checked)} style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 }, style]} accessibilityRole="checkbox" accessibilityState={{ checked: !!checked }}>
            <View style={[styles.checkbox, checked ? { backgroundColor: colors.brand, borderColor: colors.brand } : null]}>
                {checked ? <Check size={13} color={colors.onBrand} strokeWidth={3.2} /> : null}
            </View>
            <View style={{ flex: 1 }}>
                <AppText size="sm" weight="700">{label}</AppText>
                {description ? <AppText size="xs" tone="muted">{description}</AppText> : null}
            </View>
            {right}
        </Pressable>
    );
}

/** Label + native switch. */
export function ToggleRow({ label, description, value, onValueChange, disabled, style }) {
    return (
        <Row justify="space-between" style={[{ paddingVertical: 4 }, style]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
                <AppText size="sm" weight="700">{label}</AppText>
                {description ? <AppText size="xs" tone="muted">{description}</AppText> : null}
            </View>
            <Switch value={!!value} onValueChange={onValueChange} disabled={disabled} trackColor={{ false: '#334155', true: colors.brandDark }} thumbColor={value ? colors.brand : '#94a3b8'} />
        </Row>
    );
}

/** − value + quantity control. */
export function Stepper({ value, onChange, min = 0, max = 99, step = 1, style }) {
    const n = Number(value) || 0;
    return (
        <Row gap={0} style={[styles.stepper, style]}>
            <Pressable onPress={() => onChange(Math.max(min, n - step))} disabled={n <= min} style={[styles.stepBtn, n <= min ? { opacity: 0.35 } : null]} accessibilityLabel="Decrease">
                <Minus size={15} color={colors.text} />
            </Pressable>
            <AppText size="md" weight="800" mono style={{ minWidth: 34, textAlign: 'center' }}>{String(n)}</AppText>
            <Pressable onPress={() => onChange(Math.min(max, n + step))} disabled={n >= max} style={[styles.stepBtn, n >= max ? { opacity: 0.35 } : null]} accessibilityLabel="Increase">
                <Plus size={15} color={colors.text} />
            </Pressable>
        </Row>
    );
}

/**
 * Date picker field (`YYYY-MM-DD` strings). Opens a month-grid calendar in a sheet.
 *   minDate / maxDate: inclusive ISO bounds     isDateDisabled(iso): extra rule
 */
export function DateField({ label, hint, error, required, value, onChange, minDate, maxDate, isDateDisabled, placeholder = 'Pick a date', clearable, style }) {
    const [open, setOpen] = useState(false);
    return (
        <Field label={label} hint={hint} error={error} required={required} style={style}>
            <Pressable onPress={() => setOpen(true)} style={[styles.inputWrap, { paddingVertical: 12 }]} accessibilityRole="button">
                <Calendar size={16} color={colors.textDim} />
                <AppText size="md" tone={isIsoDate(value) ? 'default' : 'dim'} style={{ flex: 1 }}>{isIsoDate(value) ? formatIsoDate(value) : placeholder}</AppText>
                <ChevronDown size={16} color={colors.textDim} />
            </Pressable>
            <CalendarSheet visible={open} onClose={() => setOpen(false)} value={value} onChange={onChange} minDate={minDate} maxDate={maxDate} isDateDisabled={isDateDisabled} title={label || 'Pick a date'} clearable={clearable} />
        </Field>
    );
}

/** The calendar sheet behind DateField; usable on its own. */
export function CalendarSheet({ visible, onClose, value, onChange, minDate, maxDate, isDateDisabled, title = 'Pick a date', clearable }) {
    const today = todayDhakaIso();
    const initial = isIsoDate(value) ? value : (minDate && minDate > today ? minDate : today);
    const [cursor, setCursor] = useState(initial.slice(0, 7));
    const [lastOpenValue, setLastOpenValue] = useState(null);
    if (visible && lastOpenValue !== initial) { setLastOpenValue(initial); setCursor(initial.slice(0, 7)); }
    if (!visible && lastOpenValue !== null) setLastOpenValue(null);

    const cells = useMemo(() => {
        const [y, m] = cursor.split('-').map(Number);
        const first = new Date(y, m - 1, 1);
        const total = new Date(y, m, 0).getDate();
        const out = [];
        for (let i = 0; i < first.getDay(); i++) out.push(null);
        for (let d = 1; d <= total; d++) out.push(toIsoLocal(new Date(y, m - 1, d)));
        while (out.length % 7 !== 0) out.push(null);
        return out;
    }, [cursor]);

    const [cy, cm] = cursor.split('-').map(Number);
    const canPrev = !minDate || cursor > minDate.slice(0, 7);
    const canNext = !maxDate || cursor < maxDate.slice(0, 7);

    return (
        <Sheet visible={visible} onClose={onClose} title={title} icon={Calendar} scroll={false}>
            <Row justify="space-between">
                <Pressable onPress={() => canPrev && setCursor(shiftMonth(cursor, -1))} style={[styles.calNav, !canPrev ? { opacity: 0.3 } : null]} accessibilityLabel="Previous month">
                    <ChevronLeft size={18} color={colors.text} />
                </Pressable>
                <AppText size="md" weight="800">{`${MONTH_NAMES[cm - 1]} ${cy}`}</AppText>
                <Pressable onPress={() => canNext && setCursor(shiftMonth(cursor, 1))} style={[styles.calNav, !canNext ? { opacity: 0.3 } : null]} accessibilityLabel="Next month">
                    <ChevronRight size={18} color={colors.text} />
                </Pressable>
            </Row>
            <View style={{ flexDirection: 'row' }}>
                {SHORT_DAYS.map(d => (
                    <View key={d} style={styles.calCell}>
                        <AppText size="xxs" tone="dim" weight="800" upper>{d}</AppText>
                    </View>
                ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {cells.map((iso, idx) => {
                    if (!iso) return <View key={`e${idx}`} style={styles.calCell} />;
                    const disabled = (minDate && iso < minDate) || (maxDate && iso > maxDate) || (isDateDisabled ? !!isDateDisabled(iso) : false);
                    const selected = iso === value;
                    const isToday = iso === today;
                    return (
                        <Pressable key={iso} disabled={disabled} onPress={() => { onChange(iso); onClose(); }} style={styles.calCell}>
                            <View style={[styles.calDay, selected ? { backgroundColor: colors.brand } : (isToday ? { borderWidth: 1, borderColor: colors.borderBrand } : null)]}>
                                <AppText size="sm" weight={selected || isToday ? '900' : '600'} style={{ color: selected ? colors.onBrand : (disabled ? colors.textDim : colors.text), opacity: disabled ? 0.45 : 1 }}>
                                    {String(parseLocalDate(iso).getDate())}
                                </AppText>
                            </View>
                        </Pressable>
                    );
                })}
            </View>
            <Row justify="space-between">
                {clearable ? <Button title="Clear" variant="ghost" size="sm" onPress={() => { onChange(''); onClose(); }} /> : <View />}
                <Button title="Today" variant="outline" size="sm" disabled={(minDate && today < minDate) || (maxDate && today > maxDate)} onPress={() => { onChange(today); onClose(); }} />
            </Row>
        </Sheet>
    );
}

/** `YYYY-MM` month switcher: ‹ October 2026 › */
export function MonthSwitcher({ value, onChange, maxMonth, minMonth, style }) {
    const canPrev = !minMonth || value > minMonth;
    const canNext = !maxMonth || value < maxMonth;
    return (
        <Row justify="space-between" style={[styles.monthSwitcher, style]}>
            <Pressable onPress={() => canPrev && onChange(shiftMonth(value, -1))} style={[styles.calNav, !canPrev ? { opacity: 0.3 } : null]} accessibilityLabel="Previous month">
                <ChevronLeft size={18} color={colors.text} />
            </Pressable>
            <AppText size="md" weight="800">{formatMonth(value)}</AppText>
            <Pressable onPress={() => canNext && onChange(shiftMonth(value, 1))} style={[styles.calNav, !canNext ? { opacity: 0.3 } : null]} accessibilityLabel="Next month">
                <ChevronRight size={18} color={colors.text} />
            </Pressable>
        </Row>
    );
}

const styles = StyleSheet.create({
    inputWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md },
    input: { flex: 1, color: colors.text, fontSize: fontSize.md, paddingVertical: 11, minHeight: 44 },
    option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: 'transparent' },
    segmented: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.md, backgroundColor: colors.input, borderWidth: 1, borderColor: colors.border },
    segment: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 12, borderRadius: radius.sm + 2, backgroundColor: colors.glass },
    segmentActive: { backgroundColor: colors.brand },
    segBadge: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.glass },
    checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.input },
    stepper: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.input },
    stepBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    calNav: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.glassStrong, alignItems: 'center', justifyContent: 'center' },
    calCell: { width: `${100 / 7}%`, alignItems: 'center', justifyContent: 'center', paddingVertical: 3 },
    calDay: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    monthSwitcher: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 6 }
});
