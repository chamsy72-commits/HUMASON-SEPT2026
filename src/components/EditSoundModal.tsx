import React, { useState, useEffect } from 'react';
import { SoundItem, UserSettings, AudioFormat } from '../types';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';
import { startSynthAudio, stopSynthAudio } from '../services/audioSynth';

interface EditSoundModalProps {
  sound: SoundItem;
  settings: UserSettings;
  onClose: () => void;
  onSave: (updatedSound: SoundItem) => void;
}

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

export const EditSoundModal: React.FC<EditSoundModalProps> = ({
  sound,
  settings,
  onClose,
  onSave
}) => {
  const isLight = settings.theme === 'light';

  // Form states initialized with existing sound values
  const [title, setTitle] = useState(sound.title);
  const [location, setLocation] = useState(sound.location);
  const [coords, setCoords] = useState(sound.coords || '36.8065° N, 10.1815° E');
  const [lat, setLat] = useState(sound.lat || 36.8065);
  const [lng, setLng] = useState(sound.lng || 10.1815);
  const [format, setFormat] = useState<AudioFormat>(sound.format || '3D Spatial');
  const [priceTND, setPriceTND] = useState(sound.priceTND || 45);
  const [soundType, setSoundType] = useState(sound.soundType || 'medina');
  const [description, setDescription] = useState(sound.description || '');
  const [image, setImage] = useState(sound.image || '');
  const [audioUrl, setAudioUrl] = useState(sound.audioUrl || '');
  const [customGenre, setCustomGenre] = useState(sound.customGenre || '');
  const [modalTaxonomy, setModalTaxonomy] = useState(sound.organology?.modalTaxonomy || '');

  // Trimming locators state
  const totalLength = parseDurationToSeconds(sound.duration);
  const [totalLengthSec, setTotalLengthSec] = useState<number>(totalLength);
  const [leftLocatorSec, setLeftLocatorSec] = useState<number>(() => {
    if (sound.trimLocators?.startSec !== undefined) {
      return Math.max(0, Math.min(totalLength - 1, sound.trimLocators.startSec));
    }
    return 0;
  });
  const [rightLocatorSec, setRightLocatorSec] = useState<number>(() => {
    if (sound.trimLocators?.endSec !== undefined) {
      return Math.min(totalLength, Math.max(1, sound.trimLocators.endSec));
    }
    return totalLength;
  });

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'locators'>('metadata');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopSynthAudio();
    };
  }, []);

  const handleTogglePlay = () => {
    if (isPlayingPreview) {
      stopSynthAudio();
      setIsPlayingPreview(false);
    } else {
      startSynthAudio(soundType, 0.85, audioUrl || sound.audioUrl);
      setIsPlayingPreview(true);
    }
  };

  const calculatedTrimDurationSec = Math.max(1, rightLocatorSec - leftLocatorSec);
  const newDurationStr = formatSecondsToMinutes(calculatedTrimDurationSec);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startRatio = leftLocatorSec / totalLengthSec;
    const endRatio = rightLocatorSec / totalLengthSec;

    const updated: SoundItem = {
      ...sound,
      title: title.trim() || sound.title,
      location: location.trim() || sound.location,
      coords: coords.trim() || sound.coords,
      lat: Number(lat) || sound.lat,
      lng: Number(lng) || sound.lng,
      format,
      priceTND: Math.max(5, Number(priceTND) || sound.priceTND),
      duration: newDurationStr,
      soundType,
      description: description.trim(),
      image: image.trim() || sound.image,
      audioUrl: audioUrl.trim() || undefined,
      customGenre: customGenre.trim() || undefined,
      trimLocators: {
        startSec: parseFloat(leftLocatorSec.toFixed(2)),
        endSec: parseFloat(rightLocatorSec.toFixed(2)),
        startRatio: parseFloat(startRatio.toFixed(3)),
        endRatio: parseFloat(endRatio.toFixed(3))
      },
      organology: sound.organology ? {
        ...sound.organology,
        modalTaxonomy: modalTaxonomy.trim() || sound.organology.modalTaxonomy
      } : modalTaxonomy.trim() ? {
        classification: 'Ethnomusicological Archive',
        modalTaxonomy: modalTaxonomy.trim(),
        geospatialOrigin: location
      } : undefined
    };

    setSaveSuccess(true);
    setTimeout(() => {
      onSave(updated);
      onClose();
    }, 400);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={() => {
        stopSynthAudio();
        onClose();
      }}
    >
      <div 
        className={`max-w-3xl w-full my-auto rounded-2xl border p-5 sm:p-8 shadow-2xl relative transition-all max-h-[90vh] overflow-y-auto ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#0B0E14] border-[#222B3D] text-[#F8FAFC] shadow-[0_0_40px_rgba(0,166,214,0.15)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            stopSynthAudio();
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              : 'bg-[#131822] hover:bg-[#222B3D] text-[#94A3B8] hover:text-white'
          }`}
          title="Fermer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 mb-6 border-[#222B3D]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-tech font-bold uppercase bg-[#D9532F]/15 text-[#D9532F] border border-[#D9532F]/40">
                Studio Master DAW
              </span>
              <span className="text-xs font-mono-tech text-[#C99738]">
                ID: {sound.specimenId || sound.id}
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Édition du Son Enregistré
            </h2>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              Ajustez les métadonnées, le tarif, la taxonomie et taillez la forme d'onde avec les locateurs audio.
            </p>
          </div>

          {/* Quick Play Audio Preview */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono-tech flex items-center gap-2 transition-all shadow-md ${
                isPlayingPreview
                  ? 'bg-[#D9532F] text-white shadow-[0_0_12px_rgba(217,83,47,0.4)]'
                  : 'bg-[#00A6D6] hover:bg-[#008fba] text-[#0B0E14] shadow-[0_0_12px_rgba(0,166,214,0.3)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isPlayingPreview ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlayingPreview ? 'Arrêter' : 'Écouter'}</span>
            </button>
          </div>
        </div>

        {/* Tab Selection: Métadonnées vs Locateurs DAW */}
        <div className="flex border-b border-[#222B3D] mb-6 font-mono-tech text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'metadata'
                ? 'border-[#00A6D6] text-[#00A6D6]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Informations & Métadonnées
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('locators')}
            className={`pb-3 px-4 border-b-2 font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === 'locators'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">content_cut</span>
            Locateurs & Découpage Audio
          </button>
        </div>

        {/* Audio Waveform Banner with Locators Display */}
        <div className={`p-4 rounded-xl border mb-6 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono-tech mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[#00A6D6] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#00A6D6] inline-block" />
                In: {formatSecondsToTime(leftLocatorSec)}
              </span>
              <span className="text-[#94A3B8]">→</span>
              <span className="text-[#C99738] font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#C99738] inline-block" />
                Out: {formatSecondsToTime(rightLocatorSec)}
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              Durée taillée : <strong className="text-white font-mono-tech">{newDurationStr}</strong> ({calculatedTrimDurationSec.toFixed(1)}s)
            </div>
          </div>

          <div className="rounded-lg p-2 bg-[#0B0E14] border border-[#222B3D]">
            <AudioWaveformCanvas
              soundId={sound.id}
              soundType={soundType}
              duration={sound.duration}
              isPlaying={isPlayingPreview}
              theme={settings.theme}
              height={44}
              barWidth={3}
              barGap={2}
              leftLocatorRatio={leftLocatorSec / totalLengthSec}
              rightLocatorRatio={rightLocatorSec / totalLengthSec}
              onSeek={(ratio) => {
                const targetSec = ratio * totalLengthSec;
                if (Math.abs(targetSec - leftLocatorSec) < Math.abs(targetSec - rightLocatorSec)) {
                  setLeftLocatorSec(Math.min(targetSec, rightLocatorSec - 0.5));
                } else {
                  setRightLocatorSec(Math.max(targetSec, leftLocatorSec + 0.5));
                }
              }}
            />
          </div>

          <p className="text-[10px] text-[#64748B] mt-2 font-mono-tech text-center">
            💡 Cliquez sur la forme d'onde pour déplacer le locateur le plus proche, ou utilisez les contrôles ci-dessous.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {activeTab === 'metadata' ? (
            <div className="space-y-4 font-mono-tech text-xs">
              {/* Title & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
                    isLight ? 'text-slate-700' : 'text-[#00A6D6]'
                  }`}>
                    Titre de l'enregistrement *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Ex: Appel à la Prière - Kairouan"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00A6D6] focus:bg-white'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
                    isLight ? 'text-slate-700' : 'text-[#00A6D6]'
                  }`}>
                    Lieu & Territoire Maghrébin *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    placeholder="Ex: Kairouan, Tunisie"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00A6D6] focus:bg-white'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>
              </div>

              {/* Format, Price & Sound Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
                    isLight ? 'text-slate-700' : 'text-[#C99738]'
                  }`}>
                    Format Audio Master
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as AudioFormat)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#C99738]'
                    }`}
                  >
                    <option value="3D Spatial">3D Spatial (Ambisonic)</option>
                    <option value="Stereo">Stereo Master 96kHz</option>
                    <option value="Ambisonic">Ambisonic B-Format</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
                    isLight ? 'text-slate-700' : 'text-[#C99738]'
                  }`}>
                    Prix Catalogue (TND)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={priceTND}
                    onChange={(e) => setPriceTND(Number(e.target.value))}
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#C99738]'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#C99738]'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-bold mb-1.5 uppercase tracking-wider text-[11px] ${
                    isLight ? 'text-slate-700' : 'text-[#C99738]'
                  }`}>
                    Type Sonore & Climat
                  </label>
                  <select
                    value={soundType}
                    onChange={(e) => setSoundType(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#C99738]'
                    }`}
                  >
                    <option value="medina">Médina & Souks</option>
                    <option value="desert">Désert & Dunes</option>
                    <option value="oasis">Oasis & Palmeraie</option>
                    <option value="coastal">Littoral & Pêcheurs</option>
                    <option value="oud">Oud & Cordes</option>
                    <option value="nay">Nay & Flûtes Pastorales</option>
                    <option value="mezwed">Mezwed & Cornemuse</option>
                    <option value="bendir">Bendir & Percussions</option>
                    <option value="darbuka">Darbuka & Rythmes</option>
                    <option value="malouf">Malouf Andalou</option>
                    <option value="gnawa">Stambeli & Gnawa</option>
                    <option value="biophony">Biophonie Saharienne</option>
                  </select>
                </div>
              </div>

              {/* Coordonnées GPS & Mode Musical */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 uppercase tracking-wider text-[11px] text-[#94A3B8]">
                    Coordonnées GPS / Atlas
                  </label>
                  <input
                    type="text"
                    value={coords}
                    onChange={(e) => setCoords(e.target.value)}
                    placeholder="Ex: 35.6781° N, 10.0963° E"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5 uppercase tracking-wider text-[11px] text-[#94A3B8]">
                    Taxonomie Modale / Organologie
                  </label>
                  <input
                    type="text"
                    value={modalTaxonomy}
                    onChange={(e) => setModalTaxonomy(e.target.value)}
                    placeholder="Ex: Maqâm Rast / Rythme Btâyhi"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold mb-1.5 uppercase tracking-wider text-[11px] text-[#94A3B8]">
                  Description & Contexte Ethnomusicologique
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Décrivez les conditions d'enregistrement, l'acoustique, les interprètes..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all font-sans text-xs ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00A6D6]'
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                  }`}
                />
              </div>

              {/* Cover Image & Audio URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1.5 uppercase tracking-wider text-[11px] text-[#94A3B8]">
                    URL Image de Pochette
                  </label>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1.5 uppercase tracking-wider text-[11px] text-[#94A3B8]">
                    URL Audio / Master Déposé
                  </label>
                  <input
                    type="text"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    placeholder="Fichier audio externe (optionnel)"
                    className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900'
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Tab Locateurs DAW Trimming */
            <div className="space-y-6 font-mono-tech text-xs">
              <div className={`p-4 rounded-xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
              }`}>
                <h4 className="font-bold text-sm text-[#00A6D6] mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">straighten</span>
                  Calibrage des Locateurs In & Out
                </h4>
                <p className="text-[#94A3B8] text-xs leading-relaxed mb-4">
                  Définissez avec précision les points d'entrée (In) et de sortie (Out) de l'échantillon. La durée de l'archive et le lecteur seront automatiquement synchronisés.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Left Locator Control */}
                  <div className="p-3 rounded-lg border border-[#00A6D6]/30 bg-[#00A6D6]/5">
                    <div className="flex justify-between items-center mb-1 text-[#00A6D6] font-bold">
                      <span>Locateur Gauche (In)</span>
                      <span>{formatSecondsToTime(leftLocatorSec)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, rightLocatorSec - 0.5)}
                      step={0.1}
                      value={leftLocatorSec}
                      onChange={(e) => setLeftLocatorSec(parseFloat(e.target.value))}
                      className="w-full accent-[#00A6D6] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1">
                      <span>00:00.0</span>
                      <span>Position : {(leftLocatorSec / totalLengthSec * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Right Locator Control */}
                  <div className="p-3 rounded-lg border border-[#C99738]/30 bg-[#C99738]/5">
                    <div className="flex justify-between items-center mb-1 text-[#C99738] font-bold">
                      <span>Locateur Droit (Out)</span>
                      <span>{formatSecondsToTime(rightLocatorSec)}</span>
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
                    <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1">
                      <span>Position : {(rightLocatorSec / totalLengthSec * 100).toFixed(1)}%</span>
                      <span>{formatSecondsToTime(totalLengthSec)}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Trim Preset buttons */}
                <div className="mt-4 pt-3 border-t border-[#222B3D] flex flex-wrap gap-2">
                  <span className="text-[11px] text-[#64748B] self-center">Préréglages :</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftLocatorSec(0);
                      setRightLocatorSec(totalLengthSec);
                    }}
                    className="px-2.5 py-1 rounded bg-[#1E2738] hover:bg-[#2A374E] text-[#94A3B8] hover:text-white text-[11px] transition-colors"
                  >
                    Entier (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftLocatorSec(0);
                      setRightLocatorSec(Math.min(totalLengthSec, 30));
                    }}
                    className="px-2.5 py-1 rounded bg-[#1E2738] hover:bg-[#2A374E] text-[#94A3B8] hover:text-white text-[11px] transition-colors"
                  >
                    Extrait 30s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftLocatorSec(0);
                      setRightLocatorSec(Math.min(totalLengthSec, 60));
                    }}
                    className="px-2.5 py-1 rounded bg-[#1E2738] hover:bg-[#2A374E] text-[#94A3B8] hover:text-white text-[11px] transition-colors"
                  >
                    Extrait 60s
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const mid = totalLengthSec / 2;
                      setLeftLocatorSec(Math.max(0, mid - 15));
                      setRightLocatorSec(Math.min(totalLengthSec, mid + 15));
                    }}
                    className="px-2.5 py-1 rounded bg-[#1E2738] hover:bg-[#2A374E] text-[#94A3B8] hover:text-white text-[11px] transition-colors"
                  >
                    Cœur de l'enregistrement (30s)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#222B3D] flex items-center justify-between">
            <div className="text-[11px] text-[#94A3B8] font-mono-tech">
              {saveSuccess && (
                <span className="text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Modifications enregistrées !
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  stopSynthAudio();
                  onClose();
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold font-mono-tech transition-colors ${
                  isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-[#131822] text-[#94A3B8] hover:text-white border border-[#222B3D]'
                }`}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl text-xs font-bold font-mono-tech flex items-center gap-2 bg-[#D9532F] hover:bg-[#BA4120] text-white shadow-lg shadow-[#D9532F]/20 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
