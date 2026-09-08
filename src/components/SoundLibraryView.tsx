import React, { useState } from 'react';
import { SoundItem, UserSettings, CartItem } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { startSynthAudio, stopSynthAudio } from '../services/audioSynth';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';
import { EditSoundModal } from './EditSoundModal';

interface SoundLibraryViewProps {
  sounds: SoundItem[];
  selectedSound: SoundItem | null;
  onSelectSound: (sound: SoundItem) => void;
  onAddToCart: (item: { id: string; title: string; subtitle: string; priceUSD: number; type: 'pack' | 'sound' | 'plan' }) => void;
  onOpenExpressBuy: (sound: SoundItem) => void;
  onNavigateToAtlas: (sound?: SoundItem) => void;
  onOpenDepositModal: () => void;
  settings: UserSettings;
  isAdminAuthenticated?: boolean;
  onDeleteSound?: (soundId: string) => void;
  onNavigateToAdmin?: (sound?: SoundItem) => void;
  onUpdateSound?: (sound: SoundItem, audioBlob?: Blob, imageBlob?: Blob) => void;
}

export const SoundLibraryView: React.FC<SoundLibraryViewProps> = ({
  sounds,
  selectedSound,
  onSelectSound,
  onAddToCart,
  onOpenExpressBuy,
  onNavigateToAtlas,
  onOpenDepositModal,
  settings,
  isAdminAuthenticated,
  onDeleteSound,
  onNavigateToAdmin,
  onUpdateSound
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const isLight = settings.theme === 'light';

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'duration'>('popular');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [soundToDelete, setSoundToDelete] = useState<SoundItem | null>(null);
  const [soundToEdit, setSoundToEdit] = useState<SoundItem | null>(null);

  // Price conversion helper
  const formatPrice = (priceTND: number) => {
    if (settings.currency === 'USD') {
      return `$${(priceTND * 0.32).toFixed(2)} USD`;
    }
    if (settings.currency === 'EUR') {
      return `${(priceTND * 0.30).toFixed(2)} €`;
    }
    return `${priceTND.toFixed(1)} TND`;
  };

  const getPriceUSD = (priceTND: number) => Math.round(priceTND * 0.32);

  // Handle local play preview
  const handleTogglePlay = (sound: SoundItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectSound(sound);
    if (playingId === sound.id) {
      stopSynthAudio();
      setPlayingId(null);
    } else {
      startSynthAudio(sound.soundType, 0.85, sound.audioUrl);
      setPlayingId(sound.id);
    }
  };

  // Filter sounds
  const filteredSounds = sounds.filter(sound => {
    // Category filter
    if (filterCategory !== 'all') {
      if (filterCategory === 'medina' && sound.soundType !== 'medina') return false;
      if (filterCategory === 'desert' && sound.soundType !== 'desert') return false;
      if (filterCategory === 'coastal' && sound.soundType !== 'coastal') return false;
      if (filterCategory === 'oud' && sound.soundType !== 'oud') return false;
      if (filterCategory === 'nay' && sound.soundType !== 'nay') return false;
      if (filterCategory === 'mezwed' && sound.soundType !== 'mezwed') return false;
      if (filterCategory === 'darbuka' && sound.soundType !== 'darbuka') return false;
      if (filterCategory === 'bendir' && sound.soundType !== 'bendir') return false;
      if (filterCategory === 'malouf' && sound.soundType !== 'malouf') return false;
      if (filterCategory === 'gnawa' && sound.soundType !== 'gnawa') return false;
      if (filterCategory === 'oasis' && sound.soundType !== 'oasis') return false;
      if (filterCategory === 'biophony' && sound.soundType !== 'biophony') return false;
    }

    // Format filter
    if (filterFormat !== 'all' && sound.format !== filterFormat) {
      return false;
    }

    // Search query
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      const match =
        sound.title.toLowerCase().includes(q) ||
        sound.location.toLowerCase().includes(q) ||
        sound.description.toLowerCase().includes(q) ||
        sound.format.toLowerCase().includes(q) ||
        sound.soundType.toLowerCase().includes(q) ||
        (sound.customGenre && sound.customGenre.toLowerCase().includes(q)) ||
        sound.organology?.modalTaxonomy?.toLowerCase().includes(q) ||
        sound.organology?.classification?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Sort sounds
  const sortedSounds = [...filteredSounds].sort((a, b) => {
    if (sortBy === 'price-asc') return a.priceTND - b.priceTND;
    if (sortBy === 'price-desc') return b.priceTND - a.priceTND;
    if (sortBy === 'duration') return b.duration.localeCompare(a.duration);
    return 0; // popular / default order
  });

  const categories = [
    { id: 'all', label: 'Tous les sons', icon: 'grid_view', count: sounds.length },
    { id: 'coastal', label: 'Océan & Côtes', icon: 'waves', count: sounds.filter(s => s.soundType === 'coastal').length },
    { id: 'medina', label: 'Médina & Villes', icon: 'location_city', count: sounds.filter(s => s.soundType === 'medina').length },
    { id: 'oud', label: 'Oud & Cordes', icon: 'music_note', count: sounds.filter(s => s.soundType === 'oud').length },
    { id: 'nay', label: 'Flûte Nay', icon: 'air', count: sounds.filter(s => s.soundType === 'nay').length },
    { id: 'mezwed', label: 'Mezwed', icon: 'audiotrack', count: sounds.filter(s => s.soundType === 'mezwed').length },
    { id: 'darbuka', label: 'Darbuka', icon: 'radio_button_checked', count: sounds.filter(s => s.soundType === 'darbuka').length },
    { id: 'bendir', label: 'Bendir & Rituels', icon: 'album', count: sounds.filter(s => s.soundType === 'bendir').length },
    { id: 'malouf', label: 'Malouf Andalous', icon: 'library_music', count: sounds.filter(s => s.soundType === 'malouf').length },
    { id: 'gnawa', label: 'Gnawa & Stambali', icon: 'graphic_eq', count: sounds.filter(s => s.soundType === 'gnawa').length },
    { id: 'desert', label: 'Désert & Dunes', icon: 'landscape', count: sounds.filter(s => s.soundType === 'desert').length },
    { id: 'oasis', label: 'Oasis & Eau', icon: 'water_drop', count: sounds.filter(s => s.soundType === 'oasis').length },
    { id: 'biophony', label: 'Bio-acoustique', icon: 'nature', count: sounds.filter(s => s.soundType === 'biophony').length }
  ].filter(c => c.id === 'all' || c.count > 0);

  const featuredSound = sounds[0];

  return (
    <div className={`w-full min-h-[calc(100vh-5rem)] p-3 sm:p-6 md:p-10 pb-36 ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] transition-colors max-w-full overflow-hidden ${
      isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0B0E14] text-[#F8FAFC]'
    }`}>
      
      {/* MARKETPLACE HERO BANNER (Authentic Maghrebine DAW style) */}
      <div className={`relative rounded-2xl overflow-hidden mb-8 border transition-all shadow-xl ${
        isLight
          ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white border-slate-700'
          : 'bg-gradient-to-r from-[#0B0E14] via-[#131822] to-[#171E2C] border-[#00A6D6]/30 shadow-[0_0_35px_rgba(0,166,214,0.15)]'
      }`}>
        {/* Subtle grid background effect */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#00A6D6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative p-6 sm:p-8 md:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A6D6]/15 border border-[#00A6D6]/40 text-[#00A6D6] font-mono-tech text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00A6D6] animate-ping" />
              Marketplace Sonore • Nouveautés Masters 96kHz
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-display tracking-tight text-white leading-tight">
              Bibliothèque Audio Ethnomusicologique & Marketplace
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Préécoutez, éditez et téléchargez des ambiances sonores rares, instruments traditionnels et enregistrements spatiaux 3D en <span className="text-[#00A6D6] font-bold">3 clics seulement</span> avec licence commerciale instantanée.
            </p>

            {/* Quick value badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono-tech">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/15">
                <span className="material-symbols-outlined text-sm text-[#D9532F]">bolt</span>
                Achat Express 3 Clics
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/15">
                <span className="material-symbols-outlined text-sm text-[#00A6D6]">verified</span>
                100% Droits Libérés
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-slate-200 border border-white/15">
                <span className="material-symbols-outlined text-sm text-[#C99738]">spatial_audio</span>
                Encodage 3D & Ambisonic
              </span>
              <button
                onClick={() => onNavigateToAtlas()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#00A6D6]/20 text-[#00A6D6] border border-[#00A6D6]/50 hover:bg-[#00A6D6] hover:text-[#0B0E14] transition-colors font-bold"
              >
                <span className="material-symbols-outlined text-sm">public</span>
                Voir l'Atlas Scientifique
              </button>
              <button
                onClick={onOpenDepositModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D9532F] text-white hover:bg-[#BA4120] transition-all font-bold shadow-md hover:scale-105"
              >
                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                Insérer / Déposer un Son
              </button>
            </div>
          </div>

          {/* Quick Highlight Feature Card */}
          {featuredSound && (
            <div className="w-full lg:w-80 bg-[#131822]/90 backdrop-blur-md rounded-xl p-4 border border-[#222B3D] shadow-2xl space-y-3 shrink-0">
              <div className="flex items-center justify-between text-[11px] font-mono-tech text-[#00A6D6]">
                <span className="font-bold flex items-center gap-1 text-[#C99738]">
                  <span className="material-symbols-outlined text-xs">star</span>
                  SON RECOMMANDÉ
                </span>
                <span className="text-slate-400">{featuredSound.format}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 group cursor-pointer" onClick={() => handleTogglePlay(featuredSound)}>
                  <img src={featuredSound.image} alt={featuredSound.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-[#00A6D6]/40 transition-colors">
                    <span className="material-symbols-outlined text-white text-2xl">
                      {playingId === featuredSound.id ? 'pause' : 'play_arrow'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">{featuredSound.title}</h4>
                  <p className="text-[11px] text-slate-300 truncate">{featuredSound.location}</p>
                  <p className="text-[10px] text-[#C99738] font-mono-tech mt-0.5">{formatPrice(featuredSound.priceTND)}</p>
                </div>
              </div>

              {/* Featured Sound Audio Waveform Canvas */}
              <div className="w-full bg-[#0B0E14] rounded-lg p-1.5 border border-[#222B3D]">
                <AudioWaveformCanvas
                  soundId={featuredSound.id}
                  soundType={featuredSound.soundType}
                  duration={featuredSound.duration}
                  isPlaying={playingId === featuredSound.id}
                  theme="dark"
                  height={26}
                  barWidth={2.5}
                  barGap={1.5}
                  onSeek={() => {
                    if (playingId !== featuredSound.id) {
                      handleTogglePlay(featuredSound);
                    }
                  }}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onOpenExpressBuy(featuredSound)}
                  className="flex-1 py-2 px-3 bg-[#D9532F] hover:bg-[#BA4120] text-white text-xs font-bold font-mono-tech rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Acheter ({formatPrice(featuredSound.priceTND)})
                </button>
                <button
                  onClick={() => setSoundToEdit(featuredSound)}
                  className="p-2 bg-[#1E2738] hover:bg-[#00A6D6] hover:text-[#0B0E14] text-[#00A6D6] rounded-lg transition-colors border border-[#222B3D]"
                  title="Éditer ce son enregistré"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button
                  onClick={() => onAddToCart({
                    id: featuredSound.id,
                    title: featuredSound.title,
                    subtitle: featuredSound.location,
                    priceUSD: getPriceUSD(featuredSound.priceTND),
                    type: 'sound'
                  })}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Ajouter au Panier"
                >
                  <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUICK CATEGORY TABS / GENRES PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {categories.map(cat => {
          const isActive = filterCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono-tech font-bold flex items-center gap-2 whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? isLight
                    ? 'bg-[#00A6D6] text-white border-[#00A6D6] shadow-md'
                    : 'bg-[#00A6D6] text-[#0B0E14] border-[#00A6D6] shadow-[0_0_15px_rgba(0,166,214,0.4)]'
                  : isLight
                    ? 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    : 'bg-[#131822] text-[#94A3B8] border-[#222B3D] hover:border-[#00A6D6]/50 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{cat.icon}</span>
              {cat.label}
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive
                  ? isLight ? 'bg-white/25 text-white' : 'bg-black/20 text-black'
                  : isLight ? 'bg-slate-100 text-slate-500' : 'bg-[#1E2738] text-[#94A3B8]'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SEARCH, FORMAT FILTERS & SORT CONTROLS BAR */}
      <div className={`p-4 rounded-xl mb-6 border flex flex-col md:flex-row items-center justify-between gap-4 font-mono-tech text-xs transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131822] border-[#222B3D]'
      }`}>
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Rechercher par titre, ville, mode ou instrument..."
            className={`w-full py-2 pl-9 pr-4 rounded-lg text-xs outline-none border transition-colors ${
              isLight
                ? 'bg-slate-50 border-slate-200 focus:border-[#00A6D6] text-slate-800'
                : 'bg-[#0B0E14] border-[#222B3D] focus:border-[#00A6D6] text-white'
            }`}
          />
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-slate-400">
            search
          </span>
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Format selector */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Format:</span>
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className={`p-1.5 rounded-lg border text-xs outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0B0E14] border-[#222B3D] text-white focus:border-[#00A6D6]'
              }`}
            >
              <option value="all">Tous formats</option>
              <option value="3D Spatial">3D Spatial</option>
              <option value="Ambisonic">Ambisonic</option>
              <option value="Stereo">Stereo Master</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Tri:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`p-1.5 rounded-lg border text-xs outline-none ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0B0E14] border-[#222B3D] text-white focus:border-[#00A6D6]'
              }`}
            >
              <option value="popular">Popularité</option>
              <option value="price-asc">Prix (Croissant)</option>
              <option value="price-desc">Prix (Décroissant)</option>
              <option value="duration">Durée</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className={`flex items-center p-1 rounded-lg border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0B0E14] border-[#222B3D]'
          }`}>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                viewMode === 'list'
                  ? isLight ? 'bg-white shadow text-[#00A6D6]' : 'bg-[#1E2738] text-[#00A6D6]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Liste (Splice)"
            >
              <span className="material-symbols-outlined text-base">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded flex items-center justify-center transition-colors ${
                viewMode === 'grid'
                  ? isLight ? 'bg-white shadow text-[#00A6D6]' : 'bg-[#1E2738] text-[#00A6D6]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vue Grille (Artlist)"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* RESULT COUNT & STATUS */}
      <div className="flex items-center justify-between mb-4 font-mono-tech text-xs">
        <span className={isLight ? 'text-slate-500' : 'text-[#94A3B8]'}>
          Affichage de <span className="font-bold text-[#00A6D6]">{sortedSounds.length}</span> enregistrements masters
        </span>
        <button
          onClick={onOpenDepositModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
              : 'bg-[#D9532F]/15 hover:bg-[#D9532F] border-[#D9532F]/40 text-[#D9532F] hover:text-white shadow-sm'
          }`}
        >
          <span className="material-symbols-outlined text-sm">cloud_upload</span>
          Déposer un Son (+15 TND)
        </button>
      </div>

      {/* NO RESULTS FALLBACK */}
      {sortedSounds.length === 0 && (
        <div className={`p-12 text-center rounded-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
        }`}>
          <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">music_off</span>
          <h3 className="text-base font-bold mb-1">Aucun son trouvé</h3>
          <p className="text-xs text-slate-400 mb-4">Essayez d'ajuster vos filtres de recherche ou de catégorie.</p>
          <button
            onClick={() => { setFilterCategory('all'); setFilterFormat('all'); setLocalSearch(''); }}
            className="px-4 py-2 bg-[#00A6D6] text-[#0B0E14] font-mono-tech text-xs font-bold rounded-lg"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* SOUND CATALOG: LIST VIEW (Splice / Epidemic Sound Table) */}
      {viewMode === 'list' && sortedSounds.length > 0 && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#131822] border-[#222B3D]'
        }`}>
          {/* Table Header */}
          <div className={`hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b text-[11px] font-mono-tech uppercase tracking-wider ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#0B0E14] border-[#222B3D] text-[#94A3B8]'
          }`}>
            <div className="col-span-4">Titre & Lieu d'Enregistrement</div>
            <div className="col-span-3">Forme d'Onde & Aperçu</div>
            <div className="col-span-1 text-center">Format</div>
            <div className="col-span-1 text-center">Durée</div>
            <div className="col-span-1 text-right">Prix</div>
            <div className="col-span-2 text-right">Acheter en 3 clics</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-100 dark:divide-[#1a2635]">
            {sortedSounds.map((sound, idx) => {
              const isSelected = selectedSound?.id === sound.id;
              const isSoundPlaying = playingId === sound.id;

              return (
                <div
                  key={sound.id}
                  onClick={() => onSelectSound(sound)}
                  className={`p-3 sm:px-6 sm:py-3.5 transition-all flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-center group cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-cyan-50/70 border-l-4 border-l-[#0099b8]'
                        : 'bg-[#00e5ff]/5 border-l-4 border-l-[#00e5ff]'
                      : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-[#111a26]'
                  }`}
                >
                  {/* Column 1: Artwork + Title + Tags */}
                  <div className="col-span-4 flex items-center space-x-3 w-full min-w-0">
                    <div
                      onClick={(e) => handleTogglePlay(sound, e)}
                      className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 group/art"
                    >
                      <img src={sound.image} alt={sound.title} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        isSoundPlaying ? 'bg-[#fd6c00]/80 opacity-100' : 'bg-black/50 opacity-0 group-hover/art:opacity-100'
                      }`}>
                        <span className="material-symbols-outlined text-white text-xl">
                          {isSoundPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm truncate group-hover:text-[#0099b8] dark:group-hover:text-[#00e5ff] transition-colors">
                          {sound.title}
                        </span>
                        {sound.specimenId && (
                          <span className="hidden sm:inline-block text-[9px] font-mono-tech px-1 rounded bg-slate-100 dark:bg-[#1a2635] text-slate-500 dark:text-[#8b9a9d]">
                            {sound.specimenId}
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
                        📍 {sound.location}
                      </span>
                      {sound.organology?.modalTaxonomy && (
                        <span className="text-[10px] text-[#0099b8] dark:text-[#00e5ff] font-mono-tech truncate">
                          Mode: {sound.organology.modalTaxonomy}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Canvas-based Audio Waveform Visualizer */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSoundPlaying) {
                        handleTogglePlay(sound);
                      }
                    }}
                    className="col-span-3 w-full flex items-center h-9 px-2 rounded-lg cursor-pointer bg-slate-100/50 dark:bg-[#020912]/80 border border-slate-200/50 dark:border-white/5"
                  >
                    <AudioWaveformCanvas
                      soundId={sound.id}
                      soundType={sound.soundType}
                      duration={sound.duration}
                      isPlaying={isSoundPlaying}
                      theme={settings.theme}
                      height={26}
                      barWidth={2.5}
                      barGap={1.5}
                      onSeek={() => {
                        if (!isSoundPlaying) {
                          handleTogglePlay(sound);
                        }
                      }}
                    />
                  </div>

                  {/* Column 3: Audio Format Badge */}
                  <div className="col-span-1 text-center w-full md:w-auto flex md:justify-center items-center justify-between">
                    <span className="md:hidden text-[11px] text-slate-400">Format:</span>
                    <span className={`text-[10px] font-mono-tech px-2 py-0.5 rounded-full font-bold border ${
                      sound.format === '3D Spatial'
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                        : sound.format === 'Ambisonic'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {sound.format}
                    </span>
                  </div>

                  {/* Column 4: Duration */}
                  <div className="col-span-1 text-center font-mono-tech text-xs w-full md:w-auto flex md:justify-center items-center justify-between">
                    <span className="md:hidden text-[11px] text-slate-400">Durée:</span>
                    <span className={isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}>
                      {sound.duration}
                    </span>
                  </div>

                  {/* Column 5: Price */}
                  <div className="col-span-1 text-right font-mono-tech font-bold text-xs sm:text-sm text-[#C99738] w-full md:w-auto flex md:justify-end items-center justify-between">
                    <span className="md:hidden text-[11px] text-slate-400">Prix unitaire:</span>
                    <span>{formatPrice(sound.priceTND)}</span>
                  </div>

                  {/* Column 6: Instant 3-Click Buy & Cart Action Buttons */}
                  <div className="col-span-2 flex items-center justify-end gap-1.5 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-[#222B3D]">
                    {/* 3-Click Instant Checkout Trigger */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenExpressBuy(sound);
                      }}
                      className="flex-1 md:flex-initial px-3 py-1.5 bg-[#D9532F] hover:bg-[#BA4120] text-white text-xs font-bold font-mono-tech rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                      title="Acheter instantanément en 3 clics"
                    >
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      Acheter
                    </button>

                    {/* Edit Sound Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSoundToEdit(sound);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-[#00A6D6]'
                          : 'bg-[#0B0E14] hover:bg-[#1E2738] border-[#222B3D] text-[#00A6D6] hover:text-white'
                      }`}
                      title="Éditer ce son enregistré"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>

                    {/* Add to Cart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart({
                          id: sound.id,
                          title: sound.title,
                          subtitle: sound.location,
                          priceUSD: getPriceUSD(sound.priceTND),
                          type: 'sound'
                        });
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-[#0B0E14] hover:bg-[#1E2738] border-[#222B3D] text-[#94A3B8] hover:text-white'
                      }`}
                      title="Ajouter au Panier"
                    >
                      <span className="material-symbols-outlined text-base">shopping_cart</span>
                    </button>

                    {/* View on Scientific Atlas Map button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToAtlas(sound);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                          : 'bg-[#0B0E14] hover:bg-[#1E2738] border-[#222B3D] text-[#94A3B8] hover:text-[#00A6D6]'
                      }`}
                      title="Localiser sur l'Atlas Scientifique"
                    >
                      <span className="material-symbols-outlined text-base">public</span>
                    </button>

                    {/* Admin Actions (Studio Trimming & Delete) */}
                    {isAdminAuthenticated && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToAdmin) {
                              onNavigateToAdmin(sound);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-[#00A6D6]/30 bg-[#00A6D6]/10 text-[#00A6D6] hover:bg-[#00A6D6] hover:text-[#0B0E14] transition-all"
                          title="[ADMIN STUDIO] Modifier la longueur (Locateurs Left/Right)"
                        >
                          <span className="material-symbols-outlined text-base">content_cut</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSoundToDelete(sound);
                          }}
                          className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          title="[ADMIN] Supprimer définitivement de la bibliothèque"
                        >
                          <span className="material-symbols-outlined text-base">delete_forever</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SOUND CATALOG: GRID VIEW (Authentic Maghrebine Studio Cards) */}
      {viewMode === 'grid' && sortedSounds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedSounds.map(sound => {
            const isSoundPlaying = playingId === sound.id;
            return (
              <div
                key={sound.id}
                className={`rounded-xl border overflow-hidden flex flex-col justify-between transition-all group hover:scale-[1.01] ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                    : 'bg-[#131822] border-[#222B3D] hover:border-[#00A6D6]/60 hover:shadow-[0_0_20px_rgba(0,166,214,0.15)]'
                }`}
              >
                <div>
                  {/* Card Cover Photo with Play Button Overlay */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#0B0E14] cursor-pointer" onClick={() => handleTogglePlay(sound)}>
                    <img src={sound.image} alt={sound.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Format Badge */}
                    <span className="absolute top-2 left-2 text-[10px] font-mono-tech px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {sound.format}
                    </span>

                    {/* Duration Badge */}
                    <span className="absolute top-2 right-2 text-[10px] font-mono-tech px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300">
                      {sound.duration}
                    </span>

                    {/* Play Button Trigger */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isSoundPlaying
                          ? 'bg-[#D9532F] text-white scale-110 shadow-[0_0_15px_rgba(217,83,47,0.5)]'
                          : 'bg-black/60 text-white backdrop-blur-md group-hover:bg-[#00A6D6] group-hover:text-[#0B0E14] group-hover:scale-110'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">
                          {isSoundPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white font-bold text-sm truncate">{sound.title}</p>
                      <p className="text-slate-300 text-[11px] truncate">📍 {sound.location}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-2.5">
                    <p className={`text-xs line-clamp-2 ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>
                      {sound.description}
                    </p>

                    {/* Canvas Waveform Visualizer for Card */}
                    <div className={`p-1 rounded-lg border ${
                      isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0B0E14] border-[#222B3D]'
                    }`}>
                      <AudioWaveformCanvas
                        soundId={sound.id}
                        soundType={sound.soundType}
                        duration={sound.duration}
                        isPlaying={isSoundPlaying}
                        theme={settings.theme}
                        height={24}
                        barWidth={2}
                        barGap={1.5}
                        onSeek={() => {
                          if (!isSoundPlaying) {
                            handleTogglePlay(sound);
                          }
                        }}
                      />
                    </div>

                    {sound.organology?.modalTaxonomy && (
                      <div className="flex items-center gap-1 text-[11px] font-mono-tech text-[#00A6D6]">
                        <span className="material-symbols-outlined text-xs">tune</span>
                        <span className="truncate">{sound.organology.modalTaxonomy}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer & 3-Click Buy Actions */}
                <div className={`p-4 border-t flex items-center justify-between gap-2 ${
                  isLight ? 'bg-slate-50 border-slate-100' : 'bg-[#0B0E14] border-[#222B3D]'
                }`}>
                  <span className="text-sm font-extrabold font-mono-tech text-[#C99738]">
                    {formatPrice(sound.priceTND)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenExpressBuy(sound)}
                      className="px-3 py-1.5 bg-[#D9532F] hover:bg-[#BA4120] text-white text-xs font-bold font-mono-tech rounded-lg flex items-center gap-1 transition-all active:scale-95"
                      title="Acheter en 3 clics"
                    >
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      Acheter
                    </button>

                    {/* Edit Sound Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSoundToEdit(sound);
                      }}
                      className="p-1.5 rounded-lg border border-[#00A6D6]/30 bg-[#00A6D6]/10 text-[#00A6D6] hover:bg-[#00A6D6] hover:text-[#0B0E14] transition-all"
                      title="Éditer ce son enregistré"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>

                    <button
                      onClick={() => onAddToCart({
                        id: sound.id,
                        title: sound.title,
                        subtitle: sound.location,
                        priceUSD: getPriceUSD(sound.priceTND),
                        type: 'sound'
                      })}
                      className="p-1.5 rounded-lg border border-slate-300 dark:border-[#222B3D] text-slate-500 dark:text-[#94A3B8] hover:text-white hover:bg-[#1E2738] transition-colors"
                      title="Ajouter au Panier"
                    >
                      <span className="material-symbols-outlined text-base">shopping_cart</span>
                    </button>

                    {/* Admin Actions for Grid Card */}
                    {isAdminAuthenticated && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToAdmin) {
                              onNavigateToAdmin(sound);
                            }
                          }}
                          className="p-1.5 rounded-lg border border-[#00A6D6]/30 bg-[#00A6D6]/10 text-[#00A6D6] hover:bg-[#00A6D6] hover:text-[#0B0E14] transition-all"
                          title="[ADMIN STUDIO] Modifier la longueur (Locateurs)"
                        >
                          <span className="material-symbols-outlined text-base">content_cut</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSoundToDelete(sound);
                          }}
                          className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                          title="[ADMIN] Supprimer définitivement"
                        >
                          <span className="material-symbols-outlined text-base">delete_forever</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK LINK TO SCIENTIFIC ATLAS & ETHNOMUSICOLOGY RESEARCH */}
      <div className={`mt-12 p-6 sm:p-8 rounded-2xl border transition-all flex flex-col md:flex-row items-center justify-between gap-6 ${
        isLight
          ? 'bg-slate-100 border-slate-300 text-slate-800'
          : 'bg-gradient-to-r from-[#0B0E14] to-[#131822] border-[#00A6D6]/30 text-[#F8FAFC] shadow-[0_0_30px_rgba(0,166,214,0.1)]'
      }`}>
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-[#00A6D6] font-mono-tech text-xs font-bold uppercase">
            <span className="material-symbols-outlined text-base">school</span>
            Mission Pédagogique & Recherche Ethnomusicologique
          </div>
          <h3 className="text-xl font-bold font-display">
            Explorez l'Atlas Géographique & Scientifique des Sons
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed">
            Consultez notre cartographie interactive d'Afrique du Nord à vocation académique. Visualisez les coordonnées GPS de captation, les relevés spectraux et les classifications taxonomiques des instruments traditionnels.
          </p>
        </div>

        <button
          onClick={() => onNavigateToAtlas()}
          className="px-5 py-3 bg-[#00A6D6] hover:bg-[#008fba] text-[#0B0E14] font-mono-tech text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:scale-105 shrink-0"
        >
          <span className="material-symbols-outlined text-lg">public</span>
          Accéder à l'Atlas Scientifique
        </button>
      </div>

      {/* EDIT SOUND MODAL */}
      {soundToEdit && (
        <EditSoundModal
          sound={soundToEdit}
          settings={settings}
          onClose={() => setSoundToEdit(null)}
          onSave={(updated, audioBlob, imageBlob) => {
            if (onUpdateSound) {
              onUpdateSound(updated, audioBlob, imageBlob);
            }
            setSoundToEdit(null);
          }}
        />
      )}

      {/* ADMIN SOUND DELETION CONFIRMATION MODAL */}
      {soundToDelete && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono-tech animate-fadeIn"
          onClick={() => setSoundToDelete(null)}
        >
          <div 
            className="w-full max-w-md bg-[#131822] border border-red-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.25)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-2xl">delete_forever</span>
            </div>

            <h3 className="text-lg font-bold font-display text-white mb-1">
              Supprimer de la Bibliothèque ?
            </h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Action Administrateur : Vous êtes sur le point de retirer définitivement l'enregistrement sonore « <strong className="text-white">{soundToDelete.title}</strong> » de la plateforme.
            </p>

            <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-[11px] space-y-1 mb-5">
              <div className="flex justify-between text-[#94A3B8]">
                <span>ID Échantillon:</span>
                <span className="text-[#00A6D6] font-mono">{soundToDelete.specimenId || soundToDelete.id}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Lieu d'origine:</span>
                <span className="text-white">{soundToDelete.location}</span>
              </div>
              <div className="flex justify-between text-[#94A3B8]">
                <span>Format master:</span>
                <span className="text-[#C99738]">{soundToDelete.format}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSoundToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-[#0B0E14] hover:bg-[#1E2738] border border-[#222B3D] text-[#94A3B8] hover:text-white rounded-xl text-xs font-bold transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (onDeleteSound) {
                    onDeleteSound(soundToDelete.id);
                  }
                  if (playingId === soundToDelete.id) {
                    stopSynthAudio();
                    setPlayingId(null);
                  }
                  setSoundToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 bg-[#D9532F] hover:bg-[#BA4120] text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(217,83,47,0.4)] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
