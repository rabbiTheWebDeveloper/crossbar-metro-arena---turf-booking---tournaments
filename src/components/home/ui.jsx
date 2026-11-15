import React from 'react';
import Link from 'next/link';

/** Page gutter: 1280px content on a 1440px canvas, as in the design. */
export const Container = ({ className = '', children, ...rest }) => (
    <div className={`mx-auto w-full max-w-[1360px] px-5 sm:px-8 lg:px-10 ${className}`} {...rest}>{children}</div>
);

/** Small mono label above a heading. `tone`: 'neon' (logo green) on dark sections, 'pitch' (darker green) on light ones. */
export const Eyebrow = ({ children, tone = 'neon', className = '' }) => (
    <div className={`font-code text-[12px] uppercase tracking-[0.18em] ${tone === 'pitch' ? 'text-pitch' : 'text-neon'} ${className}`}>{children}</div>
);

/** Section heading in the condensed display face. */
export const SectionTitle = ({ children, className = '', as: Tag = 'h2' }) => (
    <Tag className={`font-bigs font-bold uppercase leading-[0.95] text-[40px] sm:text-[54px] lg:text-[68px] ${className}`}>{children}</Tag>
);

const BUTTON_BASE = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[transform,background-color,border-color,opacity] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
const BUTTON_SIZES = { md: 'h-[52px] px-6 text-[15px]', sm: 'h-11 px-5 text-[14px]' };
const BUTTON_VARIANTS = {
    neon: 'bg-neon text-ink hover:bg-neon-dim',
    outline: 'border-[1.5px] border-paper text-paper hover:bg-paper/10',
    ink: 'bg-ink text-paper hover:bg-ink/85',
    'outline-ink': 'border-[1.5px] border-ink text-ink hover:bg-ink/5'
};

/**
 * Button in the design's four styles. Renders a Next link for internal `href`, an anchor for
 * external / hash links, otherwise a <button>.
 */
export function Button({ variant = 'neon', size = 'md', href, external, className = '', children, ...rest }) {
    const cls = `${BUTTON_BASE} ${BUTTON_SIZES[size] || BUTTON_SIZES.md} ${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.neon} ${className}`;
    if (href && (external || /^(https?:|tel:|mailto:|#)/.test(href))) {
        return <a href={href} className={cls} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} {...rest}>{children}</a>;
    }
    if (href) return <Link href={href} className={cls} {...rest}>{children}</Link>;
    return <button type="button" className={cls} {...rest}>{children}</button>;
}

/** Smooth-scroll to a section of the home page. */
export function scrollToId(id) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
