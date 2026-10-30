'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useArena } from '@/context/ArenaContext';
import { Camera, Plus, Search, Eye, Star, Trash2, Edit3, Copy, Check, ExternalLink, Layers, Image as ImageIcon, X, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

const ALBUMS = ['Matches', 'Arena', 'Tournaments', 'Facilities', 'Night Floodlights', 'Community'];
const ASPECTS = [
    { value: 'wide', label: 'Wide (16:9 landscape)' },
    { value: 'square', label: 'Square (1:1)' },
    { value: 'portrait', label: 'Portrait (4:5 mobile)' }
];
const HTTPS_RE = /^https:\/\/[^\s]+$/i;
const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const fmtDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(iso || '') ? parseLocalDate(iso.slice(0, 10)).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const emptyForm = () => ({ title: '', album: 'Matches', caption: '', url: '', aspect: 'wide', featured: false, photographer: '', tags: '' });

export default function AdminGalleryManager() {
    const { galleryPhotos, handleSavePhoto, handleDeletePhoto, handleToggleFeaturedPhoto, showNotice, isLoadingData } = useArena();
    // Search, filter & view modes
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAlbum, setSelectedAlbum] = useState('All');
    const [onlyFeatured, setOnlyFeatured] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPhoto, setEditingPhoto] = useState(null);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [previewFailed, setPreviewFailed] = useState(false);
    // Form state
    const [form, setForm] = useState(emptyForm());
    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const albumsList = useMemo(() => ['All', ...Array.from(new Set(galleryPhotos.map(p => p.album).filter(Boolean)))], [galleryPhotos]);

    const filteredPhotos = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return galleryPhotos.filter(photo => {
            const matchesSearch = !q || [photo.title, photo.caption, photo.photographer, ...(photo.tags || [])].some(v => String(v || '').toLowerCase().includes(q));
            const matchesAlbum = selectedAlbum === 'All' || photo.album === selectedAlbum;
            const matchesFeatured = onlyFeatured ? photo.featured : true;
            return matchesSearch && matchesAlbum && matchesFeatured;
        });
    }, [galleryPhotos, searchTerm, selectedAlbum, onlyFeatured]);

    const totalPhotosCount = galleryPhotos.length;
    const featuredCount = galleryPhotos.filter(p => p.featured).length;
    const albumCount = new Set(galleryPhotos.map(p => p.album)).size;

    const handleOpenAdd = () => { setEditingPhoto(null); setForm(emptyForm()); setFormError(''); setPreviewFailed(false); setShowAddModal(true); };
    const handleOpenEdit = (photo) => {
        setEditingPhoto(photo);
        setForm({
            title: photo.title || '',
            album: photo.album || 'Arena',
            caption: photo.caption || '',
            url: photo.url || '',
            aspect: ASPECTS.some(a => a.value === photo.aspect) ? photo.aspect : 'wide',
            featured: !!photo.featured,
            photographer: photo.photographer || '',
            tags: (photo.tags || []).join(', ')
        });
        setFormError('');
        setPreviewFailed(false);
        setShowAddModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setFormError('');
        const title = form.title.trim();
        const url = form.url.trim();
        if (!title) { setFormError('Photo title is required.'); return; }
        if (!HTTPS_RE.test(url)) { setFormError('Paste a public https:// image URL (e.g. from ImageKit or Cloudinary). File uploads and data: URLs are not supported.'); return; }
        const tags = form.tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
        const payload = {
            ...(editingPhoto ? { id: editingPhoto.id } : {}),
            title,
            album: form.album.trim() || 'Arena',
            caption: form.caption.trim(),
            url,
            aspect: form.aspect,
            featured: form.featured,
            photographer: form.photographer.trim() || undefined,
            tags
        };
        setIsSubmitting(true);
        const res = await handleSavePhoto(payload);
        setIsSubmitting(false);
        if (res?.ok && res.photo) {
            showNotice('success', editingPhoto ? 'Photo updated' : `"${res.photo.title}" added to the gallery`);
            setShowAddModal(false);
            setEditingPhoto(null);
        } else {
            setFormError(res?.error || 'Could not save the photo.');
        }
    };

    const toggleFeatured = async (photo) => {
        if (busyId) return;
        setBusyId(photo.id);
        const res = await handleToggleFeaturedPhoto(photo.id);
        setBusyId(null);
        if (res?.ok) showNotice('success', photo.featured ? 'Removed from featured' : 'Pinned to featured highlights');
    };
    const remove = async (photo) => {
        if (busyId) return;
        if (!confirm(`Delete "${photo.title}" from the gallery?`)) return;
        setBusyId(photo.id);
        const res = await handleDeletePhoto(photo.id);
        setBusyId(null);
        if (res?.ok) { showNotice('success', 'Photo deleted'); setLightboxIndex(null); }
    };

    const handleCopyUrl = async (photo) => {
        try {
            await navigator.clipboard.writeText(photo.url);
            setCopiedId(photo.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch { showNotice('error', 'Clipboard is not available in this browser.'); }
    };
    const handlePrevLightbox = () => { if (lightboxIndex !== null) setLightboxIndex(lightboxIndex === 0 ? filteredPhotos.length - 1 : lightboxIndex - 1); };
    const handleNextLightbox = () => { if (lightboxIndex !== null) setLightboxIndex(lightboxIndex === filteredPhotos.length - 1 ? 0 : lightboxIndex + 1); };

    return (<div className="space-y-6 sm:space-y-8 animate-fade-in font-sans">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-500/20">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display flex items-center gap-2.5">
            <Camera className="w-7 h-7 text-emerald-400"/>
            <span>Gallery &amp; Pitch Photos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Manage match, tournament and arena photos. Changes publish to the public gallery immediately.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link href="/gallery" target="_blank" className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 hover:border-emerald-500/40 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer">
            <span>Public Gallery</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400"/>
          </Link>

          <button type="button" onClick={handleOpenAdd} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-lime-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer">
            <Plus className="w-4 h-4 stroke-[3]"/>
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* COUNTS */}
      <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Photos</span>
            <ImageIcon className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">{totalPhotosCount}</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Featured</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400"/>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-2">{featuredCount}</div>
          <div className="text-[12px] font-mono text-slate-400 mt-1">Shown on the public home page</div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#0c131a] to-[#080d12] border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium">Albums</span>
            <Layers className="w-4 h-4 text-emerald-400"/>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-2">{albumCount}</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-[#0c131a]/95 border border-emerald-500/20 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"/>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by title, caption, tags or photographer..." className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 transition-colors outline-none font-sans"/>
            {searchTerm && (<button type="button" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">✕</button>)}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button type="button" onClick={() => setOnlyFeatured(!onlyFeatured)} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${onlyFeatured
            ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
            : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'}`}>
              <Star className={`w-3.5 h-3.5 ${onlyFeatured ? 'fill-slate-950' : 'text-amber-400'}`}/>
              <span>Featured Only</span>
            </button>

            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
              <button type="button" onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} title="Grid view">
                <LayoutGrid className="w-4 h-4"/>
              </button>
              <button type="button" onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`} title="Table view">
                <List className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {albumsList.map(album => {
            const isSelected = selectedAlbum === album;
            const count = album === 'All' ? galleryPhotos.length : galleryPhotos.filter(p => p.album === album).length;
            return (<button key={album} type="button" onClick={() => setSelectedAlbum(album)} className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold flex items-center gap-1.5 transition-all cursor-pointer ${isSelected
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-white/5 border border-white/10'}`}>
                <span>{album}</span>
                <span className={`px-1.5 rounded-full text-[11px] font-mono ${isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-white/10 text-slate-400'}`}>{count}</span>
              </button>);
        })}
        </div>
      </div>

      {/* RESULTS */}
      {isLoadingData && galleryPhotos.length === 0 ? (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 rounded-3xl bg-[#0c131a] border border-white/10"/>)}</div>)
      : filteredPhotos.length === 0 ? (<div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-white/10 space-y-3">
          <Camera className="w-10 h-10 text-slate-500 mx-auto"/>
          <h3 className="text-base font-bold text-white">No photos found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {galleryPhotos.length === 0 ? 'The gallery is empty. Add a photo by pasting an image URL.' : 'Try adjusting your search or album filter.'}
          </p>
          <button type="button" onClick={handleOpenAdd} className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer">
            Add Photo
          </button>
        </div>) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredPhotos.map((photo, idx) => {
            const isBusy = busyId === photo.id;
            return (<div key={photo.id} className={`group bg-[#0c131a] border border-white/10 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col ${isBusy ? 'opacity-60' : ''}`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"/>

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold tracking-wider uppercase backdrop-blur-md bg-black/60 text-emerald-400 border border-emerald-500/30">
                    {photo.album}
                  </span>
                  <button type="button" disabled={isBusy} onClick={() => toggleFeatured(photo)} className={`p-1.5 rounded-lg backdrop-blur-md transition-colors cursor-pointer border disabled:opacity-50 ${photo.featured
                    ? 'bg-amber-400/20 border-amber-400 text-amber-300 hover:bg-amber-400/30'
                    : 'bg-black/60 border-white/10 text-slate-400 hover:text-white hover:border-white/30'}`} title={photo.featured ? 'Featured (click to unpin)' : 'Feature on the home page'}>
                    <Star className={`w-3.5 h-3.5 ${photo.featured ? 'fill-amber-400 text-amber-400' : ''}`}/>
                  </button>
                </div>

                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-xs">
                  <button type="button" onClick={() => setLightboxIndex(idx)} className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer" title="View">
                    <Eye className="w-4 h-4"/>
                  </button>
                  <button type="button" onClick={() => handleOpenEdit(photo)} className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer" title="Edit">
                    <Edit3 className="w-4 h-4"/>
                  </button>
                  <button type="button" onClick={() => handleCopyUrl(photo)} className="p-2.5 rounded-xl bg-white/10 hover:bg-emerald-500 text-white hover:text-slate-950 transition-colors shadow-lg cursor-pointer" title="Copy URL">
                    {copiedId === photo.id ? <Check className="w-4 h-4 text-emerald-300"/> : <Copy className="w-4 h-4"/>}
                  </button>
                  <button type="button" disabled={isBusy} onClick={() => remove(photo)} className="p-2.5 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors shadow-lg cursor-pointer disabled:opacity-50" title="Delete">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>

                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-300 pointer-events-none">
                  <span className="truncate">{photo.photographer || ''}</span>
                  <span className="uppercase text-emerald-400 font-bold">{photo.aspect || 'wide'}</span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors font-display">{photo.title}</h4>
                  {photo.caption ? <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{photo.caption}</p> : null}
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[12px] text-slate-400">
                  <div className="flex items-center gap-1 truncate max-w-[65%]">
                    {photo.tags && photo.tags.length > 0 ? (photo.tags.slice(0, 2).map(tag => (<span key={tag} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">#{tag}</span>))) : (<span className="text-[11px] font-mono text-slate-500">No tags</span>)}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{fmtDate(photo.uploadedAt || photo.createdAt)}</span>
                </div>
              </div>
            </div>);
          })}
        </div>) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0c131a]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-white/5 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
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
              {filteredPhotos.map((photo, idx) => {
                const isBusy = busyId === photo.id;
                return (<tr key={photo.id} className={`hover:bg-white/[0.02] transition-colors ${isBusy ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4">
                    <img src={photo.url} alt={photo.title} className="w-14 h-10 object-cover rounded-lg border border-white/10 cursor-pointer" onClick={() => setLightboxIndex(idx)} loading="lazy"/>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-bold text-white truncate">{photo.title}</div>
                    <div className="text-[12px] text-slate-400 truncate">{photo.caption}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">{photo.album}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[12px]">{photo.photographer || '—'}</td>
                  <td className="py-3 px-4 uppercase text-[11px] font-mono text-slate-400">{photo.aspect || 'wide'}</td>
                  <td className="py-3 px-4 text-center">
                    <button type="button" disabled={isBusy} onClick={() => toggleFeatured(photo)} className={`p-1 rounded cursor-pointer disabled:opacity-50 ${photo.featured ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}>
                      <Star className={`w-4 h-4 ${photo.featured ? 'fill-amber-400' : ''}`}/>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => handleOpenEdit(photo)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white" title="Edit"><Edit3 className="w-3.5 h-3.5"/></button>
                      <button type="button" onClick={() => handleCopyUrl(photo)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white" title="Copy URL">
                        {copiedId === photo.id ? <Check className="w-3.5 h-3.5 text-emerald-400"/> : <Copy className="w-3.5 h-3.5"/>}
                      </button>
                      <button type="button" disabled={isBusy} onClick={() => remove(photo)} className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 disabled:opacity-50" title="Delete"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>
        </div>)}

      {/* ADD / EDIT PHOTO MODAL */}
      {showAddModal && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0c131a] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-5">

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Camera className="w-5 h-5"/>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white font-display">{editingPhoto ? 'Edit Photo' : 'Add Photo'}</h3>
                  <p className="text-[12px] text-slate-400">Paste a public image URL. Host images on ImageKit, Cloudinary or similar first.</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors" aria-label="Close">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Image URL (https) *</label>
                <input type="url" required value={form.url} onChange={e => { set('url', e.target.value); setPreviewFailed(false); }} placeholder="https://ik.imagekit.io/... or https://res.cloudinary.com/..." className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs font-mono outline-none"/>
                <p className="text-[11px] text-slate-500">Direct file uploads are not supported here. Upload to your image host, then paste the public https link.</p>
              </div>

              {form.url.trim() && (<div className="p-2.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
                  <div className="text-[11px] font-mono text-slate-400">Preview</div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/5 flex items-center justify-center">
                    {previewFailed ? (<span className="text-[11px] text-rose-300">Could not load this image. Check the URL is public.</span>) : (<img src={form.url.trim()} alt="Preview" className="w-full h-full object-cover" onError={() => setPreviewFailed(true)}/>)}
                  </div>
                </div>)}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Photo Title *</label>
                <input type="text" required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Friday night 7v7 final" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Album *</label>
                  <input list="cma-album-options" value={form.album} onChange={e => set('album', e.target.value)} className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none"/>
                  <datalist id="cma-album-options">{Array.from(new Set([...ALBUMS, ...albumsList.filter(a => a !== 'All')])).map(a => <option key={a} value={a}/>)}</datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Aspect Ratio</label>
                  <select value={form.aspect} onChange={e => set('aspect', e.target.value)} className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none">
                    {ASPECTS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Caption</label>
                <textarea rows={2} value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="Short description shown under the photo" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none resize-none"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Photographer / Credit</label>
                  <input type="text" value={form.photographer} onChange={e => set('photographer', e.target.value)} placeholder="e.g. Media Desk" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none"/>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tags (comma separated)</label>
                  <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="e.g. NightDerby, SuperCup" className="w-full bg-[#080d12] border border-white/10 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-xs outline-none"/>
                </div>
              </div>

              <label className="pt-2 flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400"/>
                    <span>Feature on the home page</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Featured photos appear in the public highlights reel.</div>
                </div>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} className="w-4 h-4 accent-emerald-500 cursor-pointer"/>
              </label>

              {formError && (<div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">{formError}</div>)}

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
                <button type="button" disabled={isSubmitting} onClick={() => setShowAddModal(false)} className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold cursor-pointer disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60">
                  {isSubmitting ? 'Saving…' : editingPhoto ? 'Save Changes' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* LIGHTBOX */}
      {lightboxIndex !== null && filteredPhotos[lightboxIndex] && (<div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <button onClick={() => setLightboxIndex(null)} className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" aria-label="Close"><X className="w-6 h-6"/></button>
          <button onClick={handlePrevLightbox} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" aria-label="Previous"><ChevronLeft className="w-6 h-6"/></button>
          <button onClick={handleNextLightbox} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" aria-label="Next"><ChevronRight className="w-6 h-6"/></button>

          <div className="max-w-4xl w-full text-center space-y-4">
            <img src={filteredPhotos[lightboxIndex].url} alt={filteredPhotos[lightboxIndex].title} className="max-h-[70vh] mx-auto object-contain rounded-2xl shadow-2xl border border-white/10"/>
            <div className="text-left bg-slate-900/90 p-4 rounded-2xl border border-white/10 max-w-2xl mx-auto space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  {filteredPhotos[lightboxIndex].album} · Photo {lightboxIndex + 1} of {filteredPhotos.length}
                </span>
                {filteredPhotos[lightboxIndex].photographer && (<span className="text-[11px] font-mono text-slate-400">Credit: {filteredPhotos[lightboxIndex].photographer}</span>)}
              </div>
              <h3 className="text-lg font-black text-white font-display">{filteredPhotos[lightboxIndex].title}</h3>
              {filteredPhotos[lightboxIndex].caption ? <p className="text-xs text-slate-300">{filteredPhotos[lightboxIndex].caption}</p> : null}
            </div>
          </div>
        </div>)}

    </div>);
}
