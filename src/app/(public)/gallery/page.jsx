'use client';
import React, { useState, useMemo } from 'react';
import { PageHero } from '../../../components/PageHero';
import { useArena } from '../../../context/ArenaContext';
import { Camera, Eye, Zap, Layers, Moon, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

export default function GalleryPage() {
    const { galleryPhotos, isLoadingData } = useArena();
    const [activeAlbum, setActiveAlbum] = useState('All');
    const [lightboxIndex, setLightboxIndex] = useState(null);

    const photosList = useMemo(() => {
        return Array.isArray(galleryPhotos) ? galleryPhotos : [];
    }, [galleryPhotos]);

    const albums = useMemo(() => {
        const list = Array.from(new Set(photosList.map(p => p.album).filter(Boolean)));
        return ['All', ...list];
    }, [photosList]);

    const filteredItems = useMemo(() => {
        return photosList.filter(item => {
            if (activeAlbum === 'All') return true;
            return item.album === activeAlbum;
        });
    }, [photosList, activeAlbum]);

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
                description="Explore certified visual albums covering matches, tournaments, and the floodlit night arena right next to Uttara Center Metro Station."
                stats={[
                    { label: 'Lighting', value: '400-Lux Pro LED', icon: Zap },
                    { label: 'Turf Spec', value: '50mm Monofilament', icon: Layers },
                    { label: 'Skyline', value: 'MRT Line-6 View', icon: Eye },
                    { label: 'Hours', value: '6 AM – 12 AM Midnight', icon: Moon }
                ]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Album Tabs */}
                {albums.length > 1 && (
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
                )}

                {/* Loading State */}
                {isLoadingData && photosList.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="aspect-[4/3] rounded-3xl bg-slate-900/60 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    /* Empty State - No Fake Data */
                    <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/10 max-w-lg mx-auto p-8 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white font-display uppercase tracking-wide">
                            No Photos In This Album
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Official match and tournament photos are uploaded directly from the Crossbar Arena media desk. Check back soon!
                        </p>
                    </div>
                ) : (
                    /* Gallery Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredItems.map((photo, idx) => (
                            <div
                                key={photo.id || idx}
                                onClick={() => setLightboxIndex(idx)}
                                className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 border border-white/10 cursor-pointer hover:border-emerald-500/40 transition-all shadow-lg"
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.title || 'Crossbar Arena'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                                    {photo.album && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                            {photo.album}
                                        </span>
                                    )}
                                    <h4 className="text-base font-black text-white font-display mt-0.5">
                                        {photo.title}
                                    </h4>
                                    {photo.caption && (
                                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                                            {photo.caption}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Full-Screen Lightbox Viewer */}
            {lightboxIndex !== null && filteredItems[lightboxIndex] && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                    {/* Close button */}
                    <button
                        onClick={() => setLightboxIndex(null)}
                        className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Prev button */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Previous photo"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Next button */}
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        aria-label="Next photo"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Lightbox Content */}
                    <div className="max-w-4xl w-full text-center space-y-4">
                        <img
                            src={filteredItems[lightboxIndex].url}
                            alt={filteredItems[lightboxIndex].title || 'Arena visual'}
                            className="max-h-[70vh] mx-auto object-contain rounded-2xl shadow-2xl border border-white/10"
                        />
                        <div className="text-left bg-slate-900/90 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                {filteredItems[lightboxIndex].album ? `${filteredItems[lightboxIndex].album} Album · ` : ''}Photo {lightboxIndex + 1} of {filteredItems.length}
                            </span>
                            <h3 className="text-lg font-black text-white font-display mt-0.5">
                                {filteredItems[lightboxIndex].title}
                            </h3>
                            {filteredItems[lightboxIndex].caption && (
                                <p className="text-xs text-slate-300 mt-1">
                                    {filteredItems[lightboxIndex].caption}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
