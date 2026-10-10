'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { GalleryPhoto } from '@/types';
import {
  Camera,
  Plus,
  Search,
  Filter,
  Eye,
  Star,
  Trash2,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Zap,
  Tag,
  Calendar,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';

const PRESET_IMAGE_TEMPLATES = [
  {
    title: 'Floodlit Night Championship Final',
    album: 'Matches',
    caption: 'Pro 400-Lux stadium LED floodlights in action during Friday night 7v7 championship final.',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide' as const,
    tags: ['NightDerby', 'Floodlights400Lux', '7v7Final']
  },
  {
    title: 'Metro Rail Viaduct Skyline View',
    album: 'Arena',
    caption: 'MRT Line-6 train passing directly beside the arena enclosure as dusk settles over Sector 17 Uttara.',
    url: 'https://images.unsplash.com/photo-1529900240041-22f1ff5d8793?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide' as const,
    tags: ['MRTLine6', 'UttaraSector17', 'Skyline']
  },
  {
    title: 'Uttara Metro Super Cup Trophy Kickoff',
    album: 'Tournaments',
    caption: 'BFF certified officials and captains during the coin toss at inaugural season tournament opening.',
    url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide' as const,
    tags: ['SuperCup', 'BFFReferees', 'Kickoff']
  },
  {
    title: 'FIFA Standard 50mm Shock-Pad Turf Close-up',
    album: 'Arena',
    caption: 'High-density monofilament artificial grass with eco-friendly rubber infill for natural ball bounce.',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    aspect: 'square' as const,
    tags: ['FIFAStandard', 'ShockPad', 'GrassDetail']
  },
  {
    title: 'Player Pavilion & Covered Dugouts',
    album: 'Facilities',
    caption: 'Weather-protected player pavilion with covered dugout benches and digital electronic match clock.',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide' as const,
    tags: ['Dugout', 'Pavilion', 'Warmup']
  },
  {
    title: 'Crossbar Sports Shop & Counter Pavilion',
    album: 'Facilities',
    caption: 'In-house pro shop featuring official grip socks, FIFA balls, and chilled electrolyte hydration.',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    aspect: 'square' as const,
    tags: ['ProShop', 'GripSocks', 'Hydration']
  }
];

export default function AdminGalleryManager() {
  const {
    galleryPhotos,
    handleSavePhoto,
    handleDeletePhoto,
    handleToggleFeaturedPhoto
  } = useArena();

  // Search, filter & view modes
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('All');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formAlbum, setFormAlbum] = useState('Matches');
  const [formCaption, setFormCaption] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAspect, setFormAspect] = useState<'wide' | 'square' | 'portrait'>('wide');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formPhotographer, setFormPhotographer] = useState('Admin Desk');
  const [formTags, setFormTags] = useState('');

  // Extract unique album categories
  const albumsList = useMemo(() => {
    const list = Array.from(new Set(galleryPhotos.map(p => p.album)));
    return ['All', ...list];
  }, [galleryPhotos]);

  // Filtered photos
  const filteredPhotos = useMemo(() => {
    return galleryPhotos.filter(photo => {
      const matchesSearch =
        photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (photo.photographer && photo.photographer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (photo.tags && photo.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesAlbum = selectedAlbum === 'All' || photo.album === selectedAlbum;
      const matchesFeatured = onlyFeatured ? photo.featured : true;

      return matchesSearch && matchesAlbum && matchesFeatured;
    });
  }, [galleryPhotos, searchTerm, selectedAlbum, onlyFeatured]);

  // Stats
  const totalPhotosCount = galleryPhotos.length;
  const featuredCount = galleryPhotos.filter(p => p.featured).length;
  const albumCount = new Set(galleryPhotos.map(p => p.album)).size;

  // Open modal for new photo
  const handleOpenAdd = () => {
    setEditingPhoto(null);
    setFormTitle('');
    setFormAlbum('Matches');
    setFormCaption('');
    setFormUrl('');
    setFormAspect('wide');
    setFormFeatured(false);
    setFormPhotographer('Admin Media Desk');
    setFormTags('Crossbar, Dhaka');
    setShowAddModal(true);
  };

  // Open modal for editing photo
  const handleOpenEdit = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setFormTitle(photo.title);
    setFormAlbum(photo.album);
    setFormCaption(photo.caption);
    setFormUrl(photo.url);
    setFormAspect(photo.aspect || 'wide');
    setFormFeatured(!!photo.featured);
    setFormPhotographer(photo.photographer || 'Admin Desk');
    setFormTags((photo.tags || []).join(', '));
    setShowAddModal(true);
  };

  // Quick preset apply
  const applyPreset = (preset: typeof PRESET_IMAGE_TEMPLATES[0]) => {
    setFormTitle(preset.title);
    setFormAlbum(preset.album);
    setFormCaption(preset.caption);
    setFormUrl(preset.url);
    setFormAspect(preset.aspect);
    setFormTags(preset.tags.join(', '));
  };

  // Local file upload to data URL simulation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormUrl(reader.result);
          if (!formTitle) {
            setFormTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save / Update submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    const parsedTags = formTags
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const photoData: GalleryPhoto = {
      id: editingPhoto ? editingPhoto.id : `g-${Date.now()}`,
      title: formTitle.trim(),
      album: formAlbum.trim(),
      caption: formCaption.trim() || 'Crossbar Metro Arena turf activity.',
      url: formUrl.trim(),
      aspect: formAspect,
      featured: formFeatured,
      uploadedAt: editingPhoto?.uploadedAt || new Date().toISOString().split('T')[0],
      photographer: formPhotographer.trim() || 'Admin Media Desk',
      tags: parsedTags
    };

    handleSavePhoto(photoData);
    setShowAddModal(false);
    setEditingPhoto(null);
  };

  // Copy URL with clipboard feedback
  const handleCopyUrl = (photo: GalleryPhoto) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(photo.url);
      setCopiedId(photo.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Lightbox handlers
  const handlePrevLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === 0 ? filteredPhotos.length - 1 : lightboxIndex - 1);
  };

  const handleNextLightbox = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex === filteredPhotos.length - 1 ? 0 : lightboxIndex + 1);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              13. MEDIA &amp; ASSET VAULT
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-2.5">
            <Camera className="w-7 h-7 text-emerald-400" />
            <span>Gallery &amp; Pitch Photos</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Manage high-resolution match derbies, tournament trophies, floodlight captures, and arena facility photos. Changes sync instantly to the public visual gallery.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href="/gallery"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <span>Public Gallery</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
          </Link>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload New Photo</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Photos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Total Media Assets</span>
            <ImageIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
            {totalPhotosCount}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Active in Cloud CDN</span>
          </div>
        </div>

        {/* Card 2: Featured on Website */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Featured Highlights</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-2">
            {featuredCount}
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Pinned to Public Home &amp; Feed
          </div>
        </div>

        {/* Card 3: Albums */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Active Albums</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">
            {albumCount}
          </div>
          <div className="text-[11px] font-mono text-emerald-400 mt-1">
            Categorized &amp; Filterable
          </div>
        </div>

        {/* Card 4: Quality Spec */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Lighting &amp; Pitch</span>
            <Sparkles className="w-4 h-4 text-lime-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-display text-white mt-2 truncate">
            400-Lux Pro
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Stadium LED Night Spec
          </div>
        </div>
      </div>

      {/* FILTER STRIP & SEARCH CONTROLS */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/20 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by title, caption, tags or photographer..."
              className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 transition-colors outline-none font-sans"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters: Featured & View Mode Toggle */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            
            {/* Featured toggle */}
            <button
              type="button"
              onClick={() => setOnlyFeatured(!onlyFeatured)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFeatured
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFeatured ? 'fill-slate-950' : 'text-amber-400'}`} />
              <span>Featured Only</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Album Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {albumsList.map(album => {
            const isSelected = selectedAlbum === album;
            const count = album === 'All'
              ? galleryPhotos.length
              : galleryPhotos.filter(p => p.album === album).length;

            return (
              <button
                key={album}
                type="button"
                onClick={() => setSelectedAlbum(album)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-white/5 border border-white/10'
                }`}
              >
                <span>{album}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PHOTO RESULTS LIST OR GRID */}
      {filteredPhotos.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-white/10 space-y-3">
          <Camera className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No photos found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, album filter, or add new media to the vault.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer"
          >
            Upload Photo
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="group bg-[#0c131a] border border-white/10 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80';
                  }}
                />

                {/* Ambient dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-auto">
                  {/* Album Badge */}
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md bg-black/60 text-emerald-400 border border-emerald-500/30">
                    {photo.album}
                  </span>

                  {/* Featured Button Badge */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeaturedPhoto(photo.id)}
                    className={`p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer border ${
                      photo.featured
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 hover:bg-amber-400/30'
                        : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                    }`}
                    title={photo.featured ? 'Featured on Website (Click to unpin)' : 'Click to feature on Website'}
                  >
                    <Star className={`w-3.5 h-3.5 ${photo.featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-xs">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(idx)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer"
                    title="View Fullscreen"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(photo)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(photo)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer"
                    title="Copy URL"
                  >
                    {copiedId === photo.id ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${photo.title}"?`)) {
                        handleDeletePhoto(photo.id);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white hover:text-white transition-colors shadow-lg cursor-pointer"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Overlay Info on Thumbnail */}
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-300 pointer-events-none">
                  <span className="truncate">{photo.photographer || 'Admin Desk'}</span>
                  <span className="uppercase text-emerald-400 font-bold">{photo.aspect || 'wide'}</span>
                </div>
              </div>

              {/* Card Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors font-display">
                    {photo.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {photo.caption}
                  </p>
                </div>

                {/* Tags & Date Footer */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1 truncate max-w-[65%]">
                    {photo.tags && photo.tags.length > 0 ? (
                      photo.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">No tags</span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">
                    {photo.uploadedAt || '2026-10'}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0c131a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 text-[10px] font-bold uppercase text-slate-400 border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Thumbnail</th>
                <th className="py-3 px-4">Title &amp; Caption</th>
                <th className="py-3 px-4">Album</th>
                <th className="py-3 px-4">Photographer</th>
                <th className="py-3 px-4">Aspect</th>
                <th className="py-3 px-4 text-center">Featured</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPhotos.map((photo, idx) => (
                <tr key={photo.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <img
                      src={photo.url}
                      alt={photo.title}
                      className="w-14 h-10 object-cover rounded-lg border border-white/10 cursor-pointer"
                      onClick={() => setLightboxIndex(idx)}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-white truncate">{photo.title}</div>
                    <div className="text-[11px] text-slate-400 truncate">{photo.caption}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      {photo.album}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {photo.photographer || 'Admin Desk'}
                  </td>
                  <td className="py-3 px-4 uppercase text-[10px] font-mono text-slate-400">
                    {photo.aspect || 'wide'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeaturedPhoto(photo.id)}
                      className={`p-1 rounded cursor-pointer ${
                        photo.featured ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${photo.featured ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(photo)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(photo)}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                        title="Copy URL"
                      >
                        {copiedId === photo.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${photo.title}"?`)) {
                            handleDeletePhoto(photo.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT PHOTO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display">
                    {editingPhoto ? 'Edit Arena Photo' : 'Upload & Add Pitch Photo'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Store high-definition photographs in the arena gallery repository.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Picker */}
            {!editingPhoto && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Quick Presets (1-Click Fill High-Res Arena Photo):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PRESET_IMAGE_TEMPLATES.map(preset => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-left text-[10px] text-slate-300 hover:text-emerald-400 truncate transition-colors cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Photo Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Floodlit Night Championship Final"
                  className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none"
                />
              </div>

              {/* Album & Aspect */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Album Category *</label>
                  <select
                    value={formAlbum}
                    onChange={e => setFormAlbum(e.target.value)}
                    className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none"
                  >
                    <option value="Matches">Matches &amp; Derbies</option>
                    <option value="Arena">Arena &amp; Pitch</option>
                    <option value="Tournaments">Tournaments &amp; Cups</option>
                    <option value="Facilities">Facilities &amp; Dugouts</option>
                    <option value="Night Floodlights">Night Floodlights</option>
                    <option value="Community">Community Events</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Aspect Ratio</label>
                  <select
                    value={formAspect}
                    onChange={e => setFormAspect(e.target.value as any)}
                    className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none"
                  >
                    <option value="wide">Wide (16:9 Landscape)</option>
                    <option value="square">Square (1:1 Standard)</option>
                    <option value="portrait">Portrait (4:5 Mobile)</option>
                  </select>
                </div>
              </div>

              {/* Image URL & Local Upload Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-300">
                  <span>Image Source (URL or File) *</span>
                  <label className="text-[10px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    <span>Upload from device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... or paste image URL"
                  className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs font-mono outline-none"
                />
              </div>

              {/* Image Live Preview */}
              {formUrl && (
                <div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <div className="text-[10px] font-mono text-slate-400">Live Image Preview:</div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                    <img
                      src={formUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Caption / Description</label>
                <textarea
                  rows={2}
                  value={formCaption}
                  onChange={e => setFormCaption(e.target.value)}
                  placeholder="Brief story, match context, or specifications..."
                  className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none resize-none"
                />
              </div>

              {/* Photographer & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Photographer / Credit</label>
                  <input
                    type="text"
                    value={formPhotographer}
                    onChange={e => setFormPhotographer(e.target.value)}
                    placeholder="e.g. Media Desk / Drone Unit"
                    className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="e.g. NightDerby, SuperCup, MRTLine6"
                    className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="pt-2 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>Pin to Featured Highlights</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Display prominently on the public homepage and header reel.
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={formFeatured}
                  onChange={e => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {editingPhoto ? 'Save Changes' : 'Upload to Arena Vault'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX VIEWER */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (
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
            onClick={handlePrevLightbox}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={handleNextLightbox}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Lightbox Content */}
          <div className="max-w-4xl w-full text-center space-y-4">
            <img
              src={filteredPhotos[lightboxIndex].url}
              alt={filteredPhotos[lightboxIndex].title}
              className="max-h-[70vh] mx-auto object-contain rounded-2xl shadow-2xl border border-white/10"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="text-left bg-slate-900/90 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {filteredPhotos[lightboxIndex].album} Album · Photo {lightboxIndex + 1} of {filteredPhotos.length}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Credit: {filteredPhotos[lightboxIndex].photographer || 'Admin Desk'}
                </span>
              </div>
              <h3 className="text-lg font-black text-white font-display">
                {filteredPhotos[lightboxIndex].title}
              </h3>
              <p className="text-xs text-slate-300">
                {filteredPhotos[lightboxIndex].caption}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
