'use client';

import React, { useState } from 'react';
import { PageHero } from '../../../components/PageHero';
import { Camera, Image as ImageIcon, Sparkles, Eye, Zap, Layers, Sun, Moon } from 'lucide-react';

const GALLERY_ITEMS = [
  {
    id: 'g1',
    title: 'Pitch Alpha Floodlit Night Championship',
    category: 'Pitches',
    description: '400-Lux high-mast floodlights illuminating the FIFA-grade 50mm shock-pad synthetic grass.',
    tag: '7v7 Arena',
    aspect: 'wide'
  },
  {
    id: 'g2',
    title: 'Metro Rail Skyline & Viaduct View',
    category: 'Atmosphere',
    description: 'Overlooking the Dhaka MRT Line-6 viaduct as the rapid transit glides past the arena.',
    tag: 'Skyline',
    aspect: 'square'
  },
  {
    id: 'g3',
    title: 'Pitch Bravo Speed Cage Scrimmage',
    category: 'Pitches',
    description: 'High-tempo 5v5 action with reinforced rebound walls for continuous play.',
    tag: 'Speed Cage',
    aspect: 'square'
  },
  {
    id: 'g4',
    title: 'Player Dugouts & VIP Warmup Deck',
    category: 'Facilities',
    description: 'Weather-protected player benches with direct sideline view and electronic scoreboard.',
    tag: 'Pavilion',
    aspect: 'tall'
  },
  {
    id: 'g5',
    title: 'Crossbar Cafe & Hydration Lounge',
    category: 'Facilities',
    description: 'Air-conditioned player lounge with barista coffee, electrolyte coolers, and match screens.',
    tag: 'Lounge',
    aspect: 'wide'
  },
  {
    id: 'g6',
    title: 'Friday Night Blitz Tournament Kickoff',
    category: 'Events',
    description: 'Exciting weekend tournament action under the lights with official BFF referees.',
    tag: 'Tournaments',
    aspect: 'wide'
  }
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedPhoto, setSelectedPhoto] = useState<typeof GALLERY_ITEMS[0] | null>(null);

  const categories = ['All', 'Pitches', 'Facilities', 'Atmosphere', 'Events'];

  const filteredItems = GALLERY_ITEMS.filter(item => {
    if (activeCategory === 'All') return true;
    return item.category === activeCategory;
  });

  return (
    <>
      <PageHero
        crumb="Arena Gallery"
        eyebrow="4K Visual Tour"
        eyebrowIcon={Camera}
        title="Experience The"
        highlight="Arena Atmosphere"
        description="Explore Dhaka’s premier floodlit outdoor turf directly adjacent to Uttara Center Metro Station. Take a look at our pitches, amenities, and matchday experience."
        stats={[
          { label: 'Lighting', value: '400-Lux Pro LED', icon: Zap },
          { label: 'Turf Spec', value: '50mm Monofilament', icon: Layers },
          { label: 'Skyline', value: 'MRT Line-6 View', icon: Eye },
          { label: 'Operations', value: 'Open till 12AM', icon: Moon }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Categories */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === c
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer shadow-lg"
            >
              {/* Visual simulated image placeholder with rich aesthetics */}
              <div className="h-64 w-full bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 relative p-6 flex flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    {item.tag}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider mb-1">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-bold text-white font-display group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-2xl w-full bg-slate-900 border border-white/20 rounded-2xl p-6 relative animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {selectedPhoto.tag} · {selectedPhoto.category}
                </span>
                <h3 className="text-xl font-bold text-white font-display mt-0.5">
                  {selectedPhoto.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>
            <div className="h-72 w-full rounded-xl bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900 flex items-center justify-center border border-white/10 mb-4 p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
              <div className="text-center relative z-10 max-w-md">
                <Camera className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-white font-bold text-base">{selectedPhoto.title}</h4>
                <p className="text-xs text-slate-300 mt-2">{selectedPhoto.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
