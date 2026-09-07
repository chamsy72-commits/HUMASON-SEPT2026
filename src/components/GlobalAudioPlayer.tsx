import React, { useState, useEffect } from 'react';
import { SoundItem, UserSettings } from '../types';
import { togglePlayState, getPlaybackProgress, setSynthVolume, seekPlayback } from '../services/audioSynth';
import { TRANSLATIONS } from '../data/mockData';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';

interface GlobalAudioPlayerProps {
  currentSound: SoundItem | null;
  settings: UserSettings;
  onOpenCheckout: () => void;
}

export const GlobalAudioPlayer: React.FC<GlobalAudioPlayerProps> = ({
  currentSound,
  settings
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isSpatial, setIsSpatial] = useState(settings.spatialAudio);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [progress, setProgress] = useState({ elapsed: 0, total: 262, ratio: 0 });

  useEffect(() => {
    let animationFrame: number;
    const update = () => {
      if (isPlaying) {
        const { elapsed, total, progressRatio } = getPlaybackProgress();
        setProgress({ elapsed, total, ratio: progressRatio });
      }
      animationFrame = requestAnimationFrame(update);
    };
    if (isPlaying) {
      animationFrame = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  const handlePlayToggle = () => {
    const soundType = currentSound ? currentSound.soundType : 'medina';
    const audioUrl = currentSound ? currentSound.audioUrl : undefined;
    const active = togglePlayState(soundType, volume, audioUrl);
    setIsPlaying(active);
  };

  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    seekPlayback(clickRatio);
    const { elapsed, total, progressRatio } = getPlaybackProgress();
    setProgress({ elapsed, total, ratio: progressRatio });
    if (!isPlaying) {
      const soundType = currentSound ? currentSound.soundType : 'medina';
      const audioUrl = currentSound ? currentSound.audioUrl : undefined;
      togglePlayState(soundType, volume, audioUrl);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setSynthVolume(val);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLight = settings.theme === 'light';

  return (
    <>
      <nav className={`fixed bottom-0 right-0 left-14 sm:left-20 md:left-24 z-50 h-20 sm:h-24 border-t flex items-center justify-between px-2 sm:px-6 md:px-10 transition-colors shadow-lg max-w-full overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800'
          : 'bg-[#0B0E14] border-[#222B3D] text-[#F8FAFC] shadow-[0_0_16px_rgba(0,166,214,0.2)]'
      }`}>
        {/* Track Info */}
        <div className="flex items-center space-x-2 sm:space-x-4 w-1/3 sm:w-1/4 shrink-0 overflow-hidden">
          <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
          }`}>
            {currentSound ? (
              <img
                src={currentSound.image}
                alt={currentSound.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`material-symbols-outlined text-sm sm:text-base ${isLight ? 'text-slate-400' : 'text-[#64748B]'}`}>album</span>
            )}
          </div>
          <div className="flex flex-col truncate min-w-0">
            <span className="font-mono-tech text-[11px] sm:text-xs text-[#00A6D6] font-bold truncate">
              {currentSound ? currentSound.title : t.noActiveSession}
            </span>
            <span className={`font-mono-tech text-[9px] sm:text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              {currentSound ? `${currentSound.location} • ${currentSound.format}` : '--/--'}
            </span>
          </div>
        </div>

        {/* Play Controls & Frequency Scrubber */}
        <div className="flex-1 max-w-2xl px-2 sm:px-6 flex flex-col items-center justify-center space-y-1 sm:space-y-2 min-w-0">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={handlePlayToggle}
              className="w-9 h-9 sm:w-12 sm:h-12 rounded-full border border-[#00A6D6] bg-[#00A6D6]/15 text-[#00A6D6] hover:bg-[#00A6D6] hover:text-[#0B0E14] transition-all flex items-center justify-center shadow-md hover:scale-105 shrink-0"
            >
              <span className="material-symbols-outlined text-lg sm:text-2xl fill">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>

          {/* Animated Canvas Waveform Scrubber */}
          <div className={`w-full flex items-center space-x-1.5 sm:space-x-3 font-mono-tech text-[9px] sm:text-[10px] ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
            <span className="shrink-0">{formatTime(progress.elapsed)}</span>
            <div className={`flex-1 h-7 sm:h-9 rounded-xl px-2 flex items-center overflow-hidden cursor-pointer border group min-w-0 ${
              isLight ? 'bg-slate-50 border-slate-200 hover:border-[#00A6D6]' : 'bg-[#131822] border-[#222B3D] hover:border-[#00A6D6]'
            }`}>
              <AudioWaveformCanvas
                soundId={currentSound ? currentSound.id : 'global-player'}
                soundType={currentSound ? currentSound.soundType : 'medina'}
                duration={currentSound ? currentSound.duration : '04:22'}
                isPlaying={isPlaying}
                theme={settings.theme}
                height={26}
                barWidth={2.5}
                barGap={1.5}
                onSeek={(ratio) => {
                  seekPlayback(ratio);
                  const { elapsed, total, progressRatio } = getPlaybackProgress();
                  setProgress({ elapsed, total, ratio: progressRatio });
                  if (!isPlaying) {
                    const soundType = currentSound ? currentSound.soundType : 'medina';
                    const audioUrl = currentSound ? currentSound.audioUrl : undefined;
                    togglePlayState(soundType, volume, audioUrl);
                    setIsPlaying(true);
                  }
                }}
              />
            </div>
            <span className="shrink-0">{currentSound ? currentSound.duration : '04:22'}</span>
          </div>
        </div>

        {/* Tools & Volume */}
        <div className="flex items-center space-x-2 sm:space-x-4 w-auto sm:w-1/4 justify-end font-mono-tech text-xs text-[#94A3B8] shrink-0">
          <button
            onClick={() => setIsSpatial(!isSpatial)}
            className={`flex flex-col items-center hover:text-[#00A6D6] transition-colors p-1 ${
              isSpatial ? 'text-[#00A6D6]' : ''
            }`}
            title="Spatial Audio"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">
              {isSpatial ? 'spatial_audio' : 'spatial_audio_off'}
            </span>
            <span className="text-[9px] uppercase hidden sm:block">Spatial</span>
          </button>

          <button
            onClick={() => setShowMetadataModal(true)}
            className="flex flex-col items-center hover:text-[#00A6D6] transition-colors p-1"
            title="Metadata Info"
          >
            <span className="material-symbols-outlined text-base sm:text-lg">info</span>
            <span className="text-[9px] uppercase hidden sm:block">Notice</span>
          </button>

          {/* Volume Control */}
          <div className="hidden lg:flex items-center space-x-2 border-l border-[#222B3D] pl-4">
            <span className="material-symbols-outlined text-base">
              {volume === 0 ? 'volume_off' : volume > 0.5 ? 'volume_up' : 'volume_down'}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-[#222B3D] accent-[#00A6D6] cursor-pointer"
            />
          </div>
        </div>
      </nav>

      {/* Metadata Modal */}
      {showMetadataModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#131822] border border-[#00A6D6] max-w-md w-full p-6 rounded-2xl relative font-mono-tech shadow-[0_0_30px_rgba(0,166,214,0.25)]">
            <div className="flex justify-between items-start border-b border-[#222B3D] pb-3 mb-4">
              <div>
                <h3 className="text-lg text-[#00A6D6] font-bold font-display">
                  {currentSound ? currentSound.title : 'HUMASON Audio Spec'}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  {currentSound ? currentSound.specimenId || '#4092-A' : 'Archival Specimen'}
                </p>
              </div>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="text-[#94A3B8] hover:text-[#00A6D6]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#F8FAFC] mb-6">
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-1">
                <span className="text-[#94A3B8]">FORMAT:</span>
                <span className="text-[#00A6D6]">{currentSound ? currentSound.format : '3D Spatial'}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-1">
                <span className="text-[#94A3B8]">COORDONNÉES:</span>
                <span>{currentSound ? currentSound.coords : '36.8° N, 10.1° E'}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-1">
                <span className="text-[#94A3B8]">TAXONOMIE MODALE:</span>
                <span className="text-[#C99738]">{currentSound?.organology?.modalTaxonomy || 'M7ayer 3RA9'}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-1">
                <span className="text-[#94A3B8]">CLASSIFICATION:</span>
                <span>{currentSound?.organology?.classification || 'Plucked Chordophone'}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-1">
                <span className="text-[#94A3B8]">ORIGINE:</span>
                <span>{currentSound?.organology?.geospatialOrigin || 'Afrique du Nord (Maghreb)'}</span>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] font-sans leading-relaxed mb-6">
              {currentSound?.description || 'Enregistrement sonore master haute fidélité capturé en 24-bit/96kHz non compressé pour la recherche, la diffusion et la préservation patrimoniale.'}
            </p>

            <button
              onClick={() => setShowMetadataModal(false)}
              className="w-full bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-bold py-2.5 rounded-xl text-xs uppercase"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
