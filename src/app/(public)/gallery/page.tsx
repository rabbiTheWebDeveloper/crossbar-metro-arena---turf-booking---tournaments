'use client';

import React, { useState } from 'react';
import { PageHero } from '../../../components/PageHero';
import { Camera, Image as ImageIcon, Sparkles, Eye, Zap, Layers, Sun, Moon, X, ChevronLeft, ChevronRight } from 'lucide-react';

const GALLERY_ALBUMS = [
  {
    id: 'g1',
    title: 'Floodlit Night Championship Final',
    album: 'Matches',
    caption: 'Pro 400-Lux stadium LED floodlights in action during Friday night 7v7 championship final.',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide'
  },
  {
    id: 'g2',
    title: 'Metro Rail Viaduct Skyline View',
    album: 'Arena',
    caption: 'MRT Line-6 train passing directly beside the arena enclosure as dusk settles over Sector 17 Uttara.',
    url: 'https://images.unsplash.com/photo-1529900240041-22f1ff5d8793?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide'
  },
  {
    id: 'g3',
    title: 'Uttara Metro Super Cup Trophy Kickoff',
    album: 'Tournaments',
    caption: 'BFF certified officials and captains during the coin toss at inaugural season tournament opening.',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide'
  },
  {
    id: 'g4',
    title: 'FIFA Standard 50mm Shock-Pad Turf Close-up',
    album: 'Arena',
    caption: 'High-density monofilament artificial grass with eco-friendly rubber infill for natural ball bounce.',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    aspect: 'square'
  },
  {
    id: 'g5',
    title: 'Squad Warm-Up & Player Dugouts',
    album: 'Arena',
    caption: 'Weather-protected player pavilion with covered dugout benches and digital electronic match clock.',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    aspect: 'square'
  },
  {
    id: 'g6',
    title: 'Friday Night Turf Blitz Knockouts',
    album: 'Tournaments',
    caption: 'High-tempo tournament action under the floodlights with live commentary and spectators.',
    url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide'
  },
  {
    id: 'g7',
    title: 'Sector 17 Strikers vs Uttara Metro FC Scrimmage',
    album: 'Matches',
    caption: 'Captains competing for ball possession in an intense competitive 90-minute derby fixture.',
    url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide'
  },
  {
    id: 'g8',
    title: 'Crossbar Sports Shop & Reception Pavilion',
    album: 'Arena',
    caption: 'In-house pro shop featuring official grip socks, FIFA balls, and chilled electrolyte hydration.',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    aspect: 'square'
  }
];

export default function GalleryPage() {
  const [activeAlbum, setActiveAlbum] = useState<string>('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const albums = ['All', 'Matches', 'Tournaments', 'Arena'];

  const filteredItems = GALLERY_ALBUMS.filter(item => {
    if (activeAlbum === 'All') return true;
    return item.album === activeAlbum;
  });

  const handlePrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? filteredItems.length - 1 : lightboxIndex - 1);
  };

  const handleNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === filteredItems.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <>
      <PageHero
        crumb="Arena Gallery"
        eyebrow="Visual Tour & Match Photo Albums"
        eyebrowIcon={Camera}
        title="Photo Albums &"
        highlight="Pitch Atmosphere"
        description="Explore 4K visual albums covering matches, tournaments, and the floodlit night arena right next to Uttara Center Metro Station."
        stats={[
          { label: 'Lighting', value: '400-Lux Pro LED', icon: Zap },
          { label: 'Turf Spec', value: '50mm Monofilament', icon: Layers },
          { label: 'Skyline', value: 'MRT Line-6 View', icon: Eye },
          { label: 'Hours', value: '6 AM – 12 AM Midnight', icon: Moon }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        
        {/* Album Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {albums.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setActiveAlbum(a)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeAlbum === a
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              {a === 'All' ? 'All Photo Albums' : `${a} Album`}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => setLightboxIndex(idx)}
              className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 border border-white/10 cursor-pointer hover:border-emerald-500/40 transition-all shadow-lg"
            >
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {photo.album}
                </span>
                <h4 className="text-base font-black text-white font-display mt-0.5">
                  {photo.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {photo.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Full-Screen Lightbox Viewer (Section 3 requirement) */}
      {lightboxIndex !== null && filteredItems[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox Content */}
          <div className="max-w-4xl w-full text-center space-y-4">
            <img
              src={filteredItems[lightboxIndex].url}
              alt={filteredItems[lightboxIndex].title}
              className="max-h-[70vh] mx-auto object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="text-left bg-slate-900/90 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {filteredItems[lightboxIndex].album} Album · Photo {lightboxIndex + 1} of {filteredItems.length}
              </span>
              <h3 className="text-lg font-black text-white font-display mt-0.5">
                {filteredItems[lightboxIndex].title}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {filteredItems[lightboxIndex].caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
