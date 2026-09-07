import React, { useState, useEffect, useRef } from 'react';
import { SoundItem, UserSettings, AudioFormat, TrimLocators } from '../types';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';
import { startSynthAudio, stopSynthAudio, getIsPlayingState } from '../services/audioSynth';

interface AdminViewProps {
  sounds: SoundItem[];
  onAddSound: (sound: SoundItem) => void;
  onUpdateSound: (sound: SoundItem) => void;
  onDeleteSound: (soundId: string) => void;
  settings: UserSettings;
  onNavigateToAtlas?: (sound?: SoundItem) => void;
}

// Convert "03:45" or seconds number to seconds
function parseDurationToSeconds(duration: string | number): number {
  if (typeof duration === 'number') return Math.max(1, duration);
  if (!duration) return 240;
  const parts = duration.split(':').map(Number);
  if (parts.length === 2) return Math.max(1, parts[0] * 60 + parts[1]);
  if (parts.length === 3) return Math.max(1, parts[0] * 3600 + parts[1] * 60 + parts[2]);
  const parsed = parseFloat(duration);
  return isNaN(parsed) ? 240 : Math.max(1, parsed);
}

function formatSecondsToTime(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  const ms = Math.floor((totalSecs % 1) * 10);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
}

function formatSecondsToMinutes(totalSecs: number): string {
  const m = Math.floor(totalSecs / 60);
  const s = Math.floor(totalSecs % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

export const AdminView: React.FC<AdminViewProps> = ({
  sounds,
  onAddSound,
  onUpdateSound,
  onDeleteSound,
  settings,
  onNavigateToAtlas
}) => {
  const isLight = settings.theme === 'light';

  // Sub-Navigation within Admin Console
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'catalog' | 'editor' | 'metrics'>('catalog');

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Selection
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(sounds.length > 0 ? sounds[0] : null);
  
  // Audio Editor (Trimming with Left & Right Locators)
  const [editingSound, setEditingSound] = useState<SoundItem | null>(sounds.length > 0 ? sounds[0] : null);
  const [leftLocatorSec, setLeftLocatorSec] = useState<number>(0);
  const [rightLocatorSec, setRightLocatorSec] = useState<number>(100);
  const [totalLengthSec, setTotalLengthSec] = useState<number>(240);
  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  
  // Create / Edit metadata form
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<SoundItem>>({
    title: '',
    location: 'Tunis, Tunisie',
    coords: '36.8065° N, 10.1815° E',
    lat: 36.8065,
    lng: 10.1815,
    format: '3D Spatial',
    duration: '03:45',
    priceTND: 45,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
    description: '',
    soundType: 'medina',
    customGenre: 'Medina Ambience',
    specimenId: `HUM-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const [deleteConfirmSound, setDeleteConfirmSound] = useState<SoundItem | null>(null);

  // Sync selected sound if removed
  useEffect(() => {
    if (selectedSound && !sounds.some(s => s.id === selectedSound.id)) {
      setSelectedSound(sounds.length > 0 ? sounds[0] : null);
    }
  }, [sounds, selectedSound]);

  // Open Audio Editor
  const handleOpenAudioEditor = (sound: SoundItem) => {
    setEditingSound(sound);
    setSelectedSound(sound);
    const totalSecs = parseDurationToSeconds(sound.duration);
    setTotalLengthSec(totalSecs);
    
    if (sound.trimLocators) {
      setLeftLocatorSec(Math.max(0, Math.min(totalSecs - 0.5, sound.trimLocators.startSec)));
      setRightLocatorSec(Math.min(totalSecs, Math.max(sound.trimLocators.startSec + 0.5, sound.trimLocators.endSec)));
    } else {
      setLeftLocatorSec(0);
      setRightLocatorSec(totalSecs);
    }
    setActiveAdminSubTab('editor');
  };

  // Close Audio Editor and stop audio
  const handleCloseAudioEditor = () => {
    stopSynthAudio();
    setPreviewPlaying(false);
  };

  // Save Audio Trimming to Sound
  const handleSaveTrimmedAudio = () => {
    if (!editingSound) return;

    const trimmedDurationSec = Math.max(1, rightLocatorSec - leftLocatorSec);
    const newDurationFormatted = formatSecondsToMinutes(trimmedDurationSec);
    const startRatio = leftLocatorSec / totalLengthSec;
    const endRatio = rightLocatorSec / totalLengthSec;

    const updatedSound: SoundItem = {
      ...editingSound,
      duration: newDurationFormatted,
      trimLocators: {
        startSec: parseFloat(leftLocatorSec.toFixed(2)),
        endSec: parseFloat(rightLocatorSec.toFixed(2)),
        startRatio: parseFloat(startRatio.toFixed(3)),
        endRatio: parseFloat(endRatio.toFixed(3))
      },
      description: editingSound.description.includes('[Édité en Studio]')
        ? editingSound.description
        : `${editingSound.description} [Édité en Studio: ${formatSecondsToTime(leftLocatorSec)} → ${formatSecondsToTime(rightLocatorSec)}]`
    };

    onUpdateSound(updatedSound);
    if (selectedSound?.id === updatedSound.id) {
      setSelectedSound(updatedSound);
    }
    setEditingSound(updatedSound);
    handleCloseAudioEditor();
  };

  // Toggle Audio Preview in Editor
  const handleTogglePreview = () => {
    if (!editingSound) return;
    if (previewPlaying) {
      stopSynthAudio();
      setPreviewPlaying(false);
    } else {
      startSynthAudio(editingSound.soundType, 0.85, editingSound.audioUrl);
      setPreviewPlaying(true);
    }
  };

  // Open Metadata Modal
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      location: 'Tozeur, Tunisie',
      coords: '33.9197° N, 8.1335° E',
      lat: 33.9197,
      lng: 8.1335,
      format: '3D Spatial',
      duration: '04:15',
      priceTND: 65,
      image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
      description: 'Enregistrement audio master haute définition capturé au cœur des oasis du sud tunisien.',
      soundType: 'desert',
      customGenre: 'Sahara Field Recording',
      specimenId: `HUM-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsMetadataModalOpen(true);
  };

  const handleOpenEditModal = (sound: SoundItem) => {
    setModalMode('edit');
    setFormData({ ...sound });
    setIsMetadataModalOpen(true);
  };

  // Save metadata
  const handleSaveMetadataForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) return;

    if (modalMode === 'create') {
      const newSound: SoundItem = {
        id: `hum-sound-${Date.now()}`,
        title: formData.title || 'Nouveau Master Audio',
        location: formData.location || 'Tunis, Tunisie',
        coords: formData.coords || '36.8065° N, 10.1815° E',
        lat: formData.lat || 36.8065,
        lng: formData.lng || 10.1815,
        format: (formData.format as AudioFormat) || '3D Spatial',
        duration: formData.duration || '03:30',
        priceTND: formData.priceTND || 45,
        image: formData.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        description: formData.description || 'Archive audio ethnomusicologique.',
        soundType: formData.soundType || 'medina',
        customGenre: formData.customGenre || 'Musique Traditionnelle',
        specimenId: formData.specimenId || `HUM-${Math.floor(1000 + Math.random() * 9000)}`
      };
      onAddSound(newSound);
      setSelectedSound(newSound);
    } else if (modalMode === 'edit' && formData.id) {
      const updated = formData as SoundItem;
      onUpdateSound(updated);
      if (selectedSound?.id === updated.id) {
        setSelectedSound(updated);
      }
    }
    setIsMetadataModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteConfirmSound) {
      onDeleteSound(deleteConfirmSound.id);
      if (selectedSound?.id === deleteConfirmSound.id) {
        const remaining = sounds.filter(s => s.id !== deleteConfirmSound.id);
        setSelectedSound(remaining.length > 0 ? remaining[0] : null);
      }
      setDeleteConfirmSound(null);
    }
  };

  // Filter list
  const filteredSounds = sounds.filter(sound => {
    const matchesSearch = 
      sound.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sound.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sound.customGenre && sound.customGenre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sound.specimenId && sound.specimenId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCat = selectedCategory === 'all' || sound.soundType === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`w-full font-mono-tech transition-colors ${
      isLight ? 'bg-white text-slate-900' : 'bg-[#0B0E14] text-[#F8FAFC]'
    }`}>
      {/* Admin Sub Header Bar (Mirroring Pro View Identity) */}
      <div className={`p-4 sm:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C99738]/15 border border-[#C99738]/40 text-[#C99738] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className={`text-lg sm:text-xl font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                CONSOLE D'ADMINISTRATION & ARCHIVAGE
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00A6D6]/15 text-[#00A6D6] border border-[#00A6D6]/30 font-mono font-bold">
                ÉDITION MASTER
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              Gestion directe du catalogue sonore, modification, suppression et découpe audio par locateurs (DAW Trimmer).
            </p>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Sub tabs switcher */}
          <div className={`flex rounded-xl p-1 border text-xs font-bold ${
            isLight ? 'bg-slate-200/70 border-slate-300' : 'bg-[#0B0E14] border-[#222B3D]'
          }`}>
            <button
              onClick={() => setActiveAdminSubTab('catalog')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeAdminSubTab === 'catalog'
                  ? isLight ? 'bg-white text-[#00A6D6] shadow-sm' : 'bg-[#1E2738] text-[#00A6D6]'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">library_music</span>
              Catalogue ({sounds.length})
            </button>
            <button
              onClick={() => {
                if (!editingSound && selectedSound) {
                  handleOpenAudioEditor(selectedSound);
                }
                setActiveAdminSubTab('editor');
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                activeAdminSubTab === 'editor'
                  ? isLight ? 'bg-white text-[#C99738] shadow-sm' : 'bg-[#1E2738] text-[#C99738]'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-sm">content_cut</span>
              Studio Découpe (Locateurs)
            </button>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#D9532F] hover:bg-[#C04320] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            Nouveau Son Master
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="p-4 sm:p-6">
        {activeAdminSubTab === 'catalog' && (
          <div className="space-y-6">
            {/* Search and Filters Header */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 items-center justify-between ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <div className="relative flex-1 w-full">
                <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-slate-400' : 'text-[#64748B]'}`}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Rechercher par titre, ID master, lieu, instrument..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-[#00A6D6]'
                      : 'bg-[#0B0E14] border-[#222B3D] text-white focus:border-[#00A6D6]'
                  }`}
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#0B0E14] border-[#222B3D] text-[#94A3B8]'
                }`}
              >
                <option value="all">Tous les types sonores</option>
                <option value="oud">Oud & Cordes</option>
                <option value="desert">Désert & Dunes</option>
                <option value="medina">Médina & Artisans</option>
                <option value="bendir">Bendir & Rythmes</option>
                <option value="coastal">Côte & Ports</option>
                <option value="mezwed">Mezwed & Vents</option>
                <option value="malouf">Malouf Andalou</option>
                <option value="gnawa">Stambeli & Gnawa</option>
                <option value="oasis">Oasis & Hydraulique</option>
              </select>
            </div>

            {/* Catalog Table */}
            <div className={`rounded-2xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b ${isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#171E2C] text-[#64748B] border-[#222B3D]'}`}>
                      <th className="p-3.5 font-bold">SPÉCIMEN & TITRE</th>
                      <th className="p-3.5 font-bold">LOCALISATION</th>
                      <th className="p-3.5 font-bold">FORMAT</th>
                      <th className="p-3.5 font-bold">DURÉE</th>
                      <th className="p-3.5 font-bold">TARIF</th>
                      <th className="p-3.5 font-bold">STATUT LOCATEURS</th>
                      <th className="p-3.5 font-bold text-right">ACTIONS DE GESTION</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-[#222B3D]/50'}`}>
                    {filteredSounds.map((sound) => {
                      const hasLocators = !!sound.trimLocators;
                      return (
                        <tr key={sound.id} className={`transition-colors ${isLight ? 'hover:bg-slate-50' : 'hover:bg-[#171E2C]/50'}`}>
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <img
                                src={sound.image}
                                alt={sound.title}
                                className="w-10 h-10 rounded-lg object-cover border border-[#222B3D] shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className="font-bold block text-sm">{sound.title}</span>
                                <span className="text-[10px] text-[#64748B] font-mono">{sound.specimenId || sound.id}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-[#94A3B8]">
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-[#D9532F]">location_on</span>
                              <span>{sound.location}</span>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00A6D6]/15 text-[#00A6D6] border border-[#00A6D6]/30">
                              {sound.format}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-bold text-[#C99738]">
                            {sound.duration}
                          </td>

                          <td className="p-3.5 font-bold">
                            {sound.priceTND} DT
                          </td>

                          <td className="p-3.5">
                            {hasLocators ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 w-max">
                                <span className="material-symbols-outlined text-xs">tune</span>
                                In/Out Définis
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-500/15 text-slate-400 border border-slate-500/30 text-[10px] w-max">
                                Fichier Original
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Audio Trimmer */}
                              <button
                                onClick={() => handleOpenAudioEditor(sound)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#00A6D6]/40 bg-[#00A6D6]/10 text-[#00A6D6] hover:bg-[#00A6D6] hover:text-[#0B0E14] font-bold text-xs flex items-center gap-1 transition-all"
                                title="Modifier la longueur d'échantillon (Locateurs Left & Right)"
                              >
                                <span className="material-symbols-outlined text-sm">content_cut</span>
                                <span className="hidden sm:inline">Locateurs</span>
                              </button>

                              {/* Edit Metadata */}
                              <button
                                onClick={() => handleOpenEditModal(sound)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  isLight
                                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                                    : 'bg-[#1E2738] hover:bg-[#2A374E] border-[#222B3D] text-[#F8FAFC]'
                                }`}
                                title="Modifier les métadonnées"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>

                              {/* Delete Sound */}
                              <button
                                onClick={() => setDeleteConfirmSound(sound)}
                                className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                                title="Effacer de la bibliothèque"
                              >
                                <span className="material-symbols-outlined text-sm">delete_forever</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Audio Trimmer & Locators */}
        {activeAdminSubTab === 'editor' && (
          <div className="space-y-6">
            {editingSound ? (
              <div className={`p-6 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
              }`}>
                {/* Header of Trimmer */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#222B3D]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00A6D6]">
                      MODULE DE TRAITEMENT AUDIO & DÉCOUPE PAR LOCATEURS
                    </span>
                    <h3 className="text-xl font-bold font-display mt-1 text-white">
                      {editingSound.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Ajustez le locateur gauche (In-Point) et le locateur droit (Out-Point) pour modifier la durée de l'échantillon.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleTogglePreview}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                        previewPlaying
                          ? 'bg-[#D9532F] text-white shadow-md'
                          : 'bg-[#00A6D6] text-[#0B0E14] shadow-[0_0_12px_rgba(0,166,214,0.3)]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {previewPlaying ? 'stop' : 'play_arrow'}
                      </span>
                      {previewPlaying ? 'Arrêter Écoute' : 'Écouter Échantillon'}
                    </button>

                    <button
                      onClick={handleSaveTrimmedAudio}
                      className="px-4 py-2 rounded-xl bg-[#C99738] hover:bg-[#AF812A] text-[#0B0E14] font-bold text-xs flex items-center gap-2 shadow-[0_0_12px_rgba(201,151,56,0.3)] transition-all"
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      Sauvegarder dans la Bibliothèque
                    </button>
                  </div>
                </div>

                {/* Waveform Canvas with Locators */}
                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#222B3D] space-y-4 mb-6">
                  <div className="flex justify-between items-center text-xs font-mono text-[#94A3B8]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00A6D6]" />
                      <span>Left Locator (In) : <strong className="text-white">{formatSecondsToTime(leftLocatorSec)}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Durée Finale Sélectionnée : <strong className="text-[#C99738] text-sm">{formatSecondsToMinutes(Math.max(1, rightLocatorSec - leftLocatorSec))}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C99738]" />
                      <span>Right Locator (Out) : <strong className="text-white">{formatSecondsToTime(rightLocatorSec)}</strong></span>
                    </div>
                  </div>

                  <AudioWaveformCanvas
                    soundId={editingSound.id}
                    soundType={editingSound.soundType}
                    duration={editingSound.duration}
                    isPlaying={previewPlaying}
                    theme="dark"
                    height={80}
                    barWidth={4}
                    barGap={2}
                    leftLocatorRatio={totalLengthSec > 0 ? leftLocatorSec / totalLengthSec : 0}
                    rightLocatorRatio={totalLengthSec > 0 ? rightLocatorSec / totalLengthSec : 1}
                  />

                  {/* Dual Sliders for Left and Right Locators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <label className="text-[#00A6D6] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                          Locateur Gauche (Début) : {formatSecondsToTime(leftLocatorSec)}
                        </label>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0.5, rightLocatorSec - 0.5)}
                        step={0.1}
                        value={leftLocatorSec}
                        onChange={(e) => setLeftLocatorSec(parseFloat(e.target.value))}
                        className="w-full accent-[#00A6D6] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <label className="text-[#C99738] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">arrow_left_alt</span>
                          Locateur Droit (Fin) : {formatSecondsToTime(rightLocatorSec)}
                        </label>
                      </div>
                      <input
                        type="range"
                        min={Math.min(totalLengthSec, leftLocatorSec + 0.5)}
                        max={totalLengthSec}
                        step={0.1}
                        value={rightLocatorSec}
                        onChange={(e) => setRightLocatorSec(parseFloat(e.target.value))}
                        className="w-full accent-[#C99738] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Sound Info & Quick Select other sound */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-[#94A3B8]">
                    Format : <strong className="text-white">{editingSound.format}</strong> • Lieu : <strong className="text-white">{editingSound.location}</strong> • Type : <strong className="text-white">{editingSound.soundType}</strong>
                  </div>
                  <button
                    onClick={() => setActiveAdminSubTab('catalog')}
                    className="text-xs text-[#00A6D6] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Choisir un autre son dans le catalogue
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border rounded-2xl bg-[#131822] border-[#222B3D]">
                <p className="text-sm text-[#94A3B8]">Veuillez sélectionner un son dans le catalogue pour modifier sa longueur.</p>
                <button
                  onClick={() => setActiveAdminSubTab('catalog')}
                  className="mt-4 px-4 py-2 bg-[#00A6D6] text-[#0B0E14] font-bold text-xs rounded-xl"
                >
                  Ouvrir le Catalogue
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Create / Edit Metadata */}
      {isMetadataModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border max-w-2xl w-full p-6 sm:p-8 rounded-2xl relative font-mono-tech shadow-2xl max-h-[90vh] overflow-y-auto ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900'
              : 'bg-[#131822] border-[#222B3D] text-[#F8FAFC]'
          }`}>
            <div className="flex justify-between items-center border-b border-[#222B3D] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold font-display text-white">
                  {modalMode === 'create' ? 'Ajouter un Son Master' : 'Modifier les Métadonnées'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {modalMode === 'create' ? 'Création et indexation d’une nouvelle archive sonore' : `Édition du fichier ${formData.specimenId || ''}`}
                </p>
              </div>
              <button
                onClick={() => setIsMetadataModalOpen(false)}
                className="text-[#64748B] hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveMetadataForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">Titre de l'échantillon *</label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">Code Spécimen</label>
                  <input
                    type="text"
                    value={formData.specimenId || ''}
                    onChange={(e) => setFormData({ ...formData, specimenId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">Lieu d'enregistrement *</label>
                  <input
                    type="text"
                    required
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                  />
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">Format Spatial</label>
                  <select
                    value={formData.format || '3D Spatial'}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value as AudioFormat })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                  >
                    <option value="3D Spatial">3D Spatial (Binaural)</option>
                    <option value="Ambisonic">Ambisonic B-Format</option>
                    <option value="Stereo">Stereo Master 96kHz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94A3B8] font-bold mb-1">Tarif (DT)</label>
                  <input
                    type="number"
                    value={formData.priceTND || 45}
                    onChange={(e) => setFormData({ ...formData, priceTND: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">URL de l'image d'illustration</label>
                <input
                  type="text"
                  value={formData.image || ''}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                />
              </div>

              <div>
                <label className="block text-[#94A3B8] font-bold mb-1">Notice Ethnomusicologique & Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[#0B0E14] border border-[#222B3D] text-white outline-none focus:border-[#00A6D6]"
                />
              </div>

              <div className="pt-4 border-t border-[#222B3D] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsMetadataModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1E2738] text-[#94A3B8] hover:text-white font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-bold text-xs uppercase"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirmSound && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="border border-red-500/40 bg-[#131822] max-w-md w-full p-6 rounded-2xl font-mono-tech shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Confirmer la suppression</h4>
            <p className="text-xs text-[#94A3B8] mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-white font-bold">"{deleteConfirmSound.title}"</strong> de la bibliothèque ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmSound(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1E2738] text-[#94A3B8] hover:text-white text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
