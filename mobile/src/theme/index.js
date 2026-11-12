/**
 * Design tokens for the Crossbar Metro Arena app.
 * Mirrors the web platform: near-black "pitch" surfaces with the #4cbf02 brand green.
 */
export const colors = {
    // surfaces
    bg: '#070b0e',
    bgDeep: '#05080b',
    card: '#0c131a',
    cardAlt: '#101b2b',
    input: '#080d12',
    overlay: 'rgba(0,0,0,0.78)',

    // lines
    border: 'rgba(255,255,255,0.09)',
    borderStrong: 'rgba(255,255,255,0.16)',
    borderBrand: 'rgba(76,191,2,0.40)',

    // brand
    brand: '#4cbf02',
    brandLight: '#95e05a',
    brandDark: '#398f02',
    brandDeep: '#193f02',
    brandSoft: 'rgba(76,191,2,0.12)',
    onBrand: '#04130c',

    // text
    text: '#f1f5f9',
    textSoft: '#cbd5e1',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    white: '#ffffff',

    // status
    success: '#4cbf02',
    successSoft: 'rgba(76,191,2,0.12)',
    danger: '#f43f5e',
    dangerSoft: 'rgba(244,63,94,0.12)',
    warning: '#fbbf24',
    warningSoft: 'rgba(251,191,36,0.12)',
    info: '#38bdf8',
    infoSoft: 'rgba(56,189,248,0.12)',
    purple: '#a78bfa',
    purpleSoft: 'rgba(167,139,250,0.12)',
    gold: '#fbbf24',

    // misc
    glass: 'rgba(255,255,255,0.04)',
    glassStrong: 'rgba(255,255,255,0.08)',
    transparent: 'transparent'
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

/** Font families embedded at build time by the expo-font config plugin (see app.json). */
export const fonts = {
    display: 'Montserrat_900Black',
    displayBold: 'Montserrat_800ExtraBold',
    heading: 'Montserrat_700Bold',
    mono: 'monospace'
};

export const fontSize = { xxs: 10, xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 30, hero: 36 };

export const shadow = {
    card: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
    brand: { shadowColor: '#4cbf02', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 }
};

/** Tone -> { fg, bg, border } triples used by Badge, Notice, StatCard, etc. */
export const tones = {
    brand: { fg: colors.brand, bg: colors.brandSoft, border: 'rgba(76,191,2,0.35)' },
    success: { fg: colors.brand, bg: colors.successSoft, border: 'rgba(76,191,2,0.35)' },
    danger: { fg: '#fb7185', bg: colors.dangerSoft, border: 'rgba(244,63,94,0.35)' },
    warning: { fg: colors.warning, bg: colors.warningSoft, border: 'rgba(251,191,36,0.35)' },
    info: { fg: colors.info, bg: colors.infoSoft, border: 'rgba(56,189,248,0.35)' },
    purple: { fg: colors.purple, bg: colors.purpleSoft, border: 'rgba(167,139,250,0.35)' },
    neutral: { fg: colors.textSoft, bg: colors.glass, border: colors.border }
};

export const theme = { colors, spacing, radius, fonts, fontSize, shadow, tones };
export default theme;
