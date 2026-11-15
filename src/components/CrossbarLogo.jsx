import React from 'react';

/**
 * The Crossbar Metro Arena logo, drawn from the brand artwork in public/brand.
 *
 * The site is dark, so these files are the logo recoloured for dark surfaces: the white background
 * is transparent and the black ink (goal frame, wordmark) is white; the greens and the ball are the
 * original ones. The untouched logo on white is public/brand/crossbar-metro-arena-logo.png.
 * `w` / `h` are the files' pixel sizes and only reserve the right aspect ratio.
 */
const ART = {
    mark: { src: '/brand/logo-mark-dark.webp', w: 520, h: 223 },
    wordmark: { src: '/brand/logo-wordmark-dark.webp', w: 640, h: 152 },
    stacked: { src: '/brand/logo-full-dark.webp', w: 900, h: 601 }
};

/** Heights per size. `lockup`: emblem + wordmark side by side (headers). `stacked`: the full logo. */
const SIZES = {
    sm: { mark: 'h-[30px]', wordmark: 'h-[27px]', stacked: 'h-[72px]' },
    // bars that also carry buttons on a phone (navbar, auth and player headers)
    responsive: { mark: 'h-7 sm:h-10', wordmark: 'h-6 sm:h-9', stacked: 'h-20 sm:h-24' },
    // the main design's header, where the logo has the phone bar almost to itself
    header: { mark: 'h-8 sm:h-10', wordmark: 'h-[29px] sm:h-9', stacked: 'h-20 sm:h-24' },
    md: { mark: 'h-11', wordmark: 'h-10', stacked: 'h-28' },
    lg: { mark: 'h-[52px]', wordmark: 'h-[46px]', stacked: 'h-36' },
    xl: { mark: 'h-[72px]', wordmark: 'h-16', stacked: 'h-48' }
};

const Art = ({ part, heightClass, className = '', alt = '' }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
        src={ART[part].src}
        width={ART[part].w}
        height={ART[part].h}
        alt={alt}
        decoding="async"
        draggable={false}
        className={`w-auto max-w-none shrink-0 ${heightClass} ${className}`}
    />
);

/**
 *   variant: 'full'    emblem + wordmark side by side, for headers and bars (default)
 *            'stacked' the logo as designed (emblem above the wordmark), where there is room
 *            'mark'    the emblem alone
 *   size:    'sm' | 'responsive' | 'header' | 'md' | 'lg' | 'xl'
 *   compact: in the side-by-side variant, show only the emblem on phones (for crowded bars)
 */
export const CrossbarLogo = ({ className = '', size = 'responsive', variant = 'full', compact = false }) => {
    const heights = SIZES[size] || SIZES.responsive;
    const label = 'Crossbar Metro Arena';

    if (variant === 'mark') {
        return <span className={`inline-flex items-center select-none ${className}`}><Art part="mark" heightClass={heights.mark} alt={label} /></span>;
    }
    if (variant === 'stacked') {
        return <span className={`inline-flex items-center select-none ${className}`}><Art part="stacked" heightClass={heights.stacked} alt={label} /></span>;
    }
    return (
        <span className={`inline-flex items-center gap-2 sm:gap-2.5 select-none ${className}`} role="img" aria-label={label}>
            <Art part="mark" heightClass={heights.mark} />
            {/* on the narrowest phones the emblem alone keeps the bar from overflowing */}
            <Art part="wordmark" heightClass={heights.wordmark} className={compact ? 'max-sm:hidden' : 'max-[339px]:hidden'} />
        </span>
    );
};
