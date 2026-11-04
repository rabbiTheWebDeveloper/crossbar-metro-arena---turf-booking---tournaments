import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { siteConfig } from '../lib/seo';

/**
 * Site-wide Open Graph / Twitter card (1200x630), generated at build time.
 * Served at /opengraph-image and referenced by buildMetadata() for every page.
 */
export const alt = 'Crossbar Metro Arena, floodlit football turf beside Uttara Metro Center, Dhaka';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadLogo() {
    try {
        const buf = await readFile(path.join(process.cwd(), 'public', 'brand', 'logo-512.png'));
        return `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
        return null;
    }
}

export default async function OpenGraphImage() {
    const logo = await loadLogo();
    return new ImageResponse(
        (<div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '56px 64px',
            background: 'linear-gradient(135deg, #070b0e 0%, #0b1a10 55%, #0f2a14 100%)',
            color: '#f8fafc',
            fontFamily: 'sans-serif',
            position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: -140, right: -120, width: 520, height: 520, borderRadius: 9999, background: 'rgba(76,191,2,0.22)', filter: 'blur(90px)' }}/>
          <div style={{ position: 'absolute', bottom: -180, left: -120, width: 480, height: 480, borderRadius: 9999, background: 'rgba(76,191,2,0.14)', filter: 'blur(90px)' }}/>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {logo && <img src={logo} width={96} height={96} alt="" style={{ borderRadius: 24 }}/>}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{siteConfig.name}</div>
              <div style={{ fontSize: 22, color: '#86efac', letterSpacing: 4, textTransform: 'uppercase' }}>{siteConfig.domain}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ fontSize: 68, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2, textTransform: 'uppercase', maxWidth: 1000 }}>
              Floodlit Football Turf in Uttara, Dhaka
            </div>
            <div style={{ fontSize: 28, color: '#cbd5e1', maxWidth: 980, lineHeight: 1.35 }}>
              12 daily 90-minute slots. Book online, pay with bKash, Nagad or card. 2 minutes from Uttara Center Metro Station.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 14 }}>
            {['Book a slot', '7v7 tournaments', 'Match results', 'MRT Line-6'].map(label => (
              <div key={label} style={{ display: 'flex', padding: '12px 22px', borderRadius: 999, border: '2px solid rgba(76,191,2,0.6)', background: 'rgba(76,191,2,0.12)', color: '#bbf7d0', fontSize: 22, fontWeight: 700 }}>
                {label}
              </div>
            ))}
          </div>
        </div>),
        { ...size }
    );
}
