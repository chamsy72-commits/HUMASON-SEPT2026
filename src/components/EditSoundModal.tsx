import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AudioFormat, SoundItem, SoundType, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { reverseGeocodeCoords, formatGpsCoordinates, parseGpsInput, getClosestOfflineLocation } from '../services/geoService';
import { startSynthAudio, stopSynthAudio } from '../services/audioSynth';
import { optimizeImageFile } from '../services/soundDatabase';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';
import { 
  QUICK_LOCATIONS, 
  ACOUSTIC_GENRES, 
  COMMON_MODAL_TAXONOMIES, 
  COMMON_ORGANOLOGY_CLASSES 
} from '../data/soundConstants';

interface EditSoundModalProps {
  sound: SoundItem;
  settings: UserSettings;
  onClose: () => void;
  onSave: (updatedSound: SoundItem, audioBlob?: Blob, imageBlob?: Blob) => void;
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
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;

  // Tabs for complete access: Map & GPS, Audio & DAW, Metadata & Organology, Visual & Pricing
  const [activeTab, setActiveTab] = useState<'map' | 'audio' | 'metadata' | 'visual'>('map');

  // Form states initialized with existing sound values
  const [title, setTitle] = useState(sound.title || '');
  const [location, setLocation] = useState(sound.location || 'Tunis, Tunisia');
  const [coords, setCoords] = useState(sound.coords || '36.8065° N, 10.1815° E');
  const [lat, setLat] = useState(sound.lat || 36.8065);
  const [lng, setLng] = useState(sound.lng || 10.1815);
  const [format, setFormat] = useState<AudioFormat>(sound.format || '3D Spatial');
  const [priceTND, setPriceTND] = useState<number>(sound.priceTND || 25);
  const [soundType, setSoundType] = useState<SoundType>(sound.soundType || 'medina');
  const [customGenre, setCustomGenre] = useState(sound.customGenre || '');
  const [description, setDescription] = useState(sound.description || '');
  const [image, setImage] = useState(sound.image || ACOUSTIC_GENRES[0].defaultImage);
  const [audioUrl, setAudioUrl] = useState(sound.audioUrl || '');
  const [specimenId, setSpecimenId] = useState(sound.specimenId || `#${Math.floor(1000 + Math.random() * 9000)}-S`);

  // Organology details
  const [modalTaxonomy, setModalTaxonomy] = useState(sound.organology?.modalTaxonomy || 'M7ayer 3RA9');
  const [classification, setClassification] = useState(sound.organology?.classification || 'Patrimoine Urbain & Médina (Soundscape)');
  const [geospatialOrigin, setGeospatialOrigin] = useState(sound.organology?.geospatialOrigin || sound.location || '');
  const [acousticTrait, setAcousticTrait] = useState(sound.organology?.acousticTrait || `${sound.format || '3D Spatial'} 96kHz / 24-bit Microphonic Master`);

  // Audio File Upload & Live Preview States
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [audioFileSize, setAudioFileSize] = useState<string>('');
  const [isAudioUploaded, setIsAudioUploaded] = useState<boolean>(Boolean(sound.audioUrl));
  const [isDraggingAudio, setIsDraggingAudio] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [previewVolume, setPreviewVolume] = useState<number>(0.85);

  // Cover Image Upload & Preview States
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [isImageUploaded, setIsImageUploaded] = useState<boolean>(Boolean(sound.image));
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);

  // Binary Blob holders for persistent IndexedDB storage
  const [audioFileBlob, setAudioFileBlob] = useState<Blob | null>(null);
  const [imageFileBlob, setImageFileBlob] = useState<Blob | null>(null);

  // Trimming Locators
  const totalLength = parseDurationToSeconds(sound.duration);
  const [totalLengthSec] = useState<number>(totalLength);
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

  // Map & Geocoding States
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopSynthAudio();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Stop audio playback when modal unmounts
  useEffect(() => {
    return () => {
      stopSynthAudio();
    };
  }, []);

  // Update Location Name Automatically based on GPS Lat/Lng with Reverse Geocoding
  const handleUpdateCoordinates = useCallback(async (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    const formatted = formatGpsCoordinates(newLat, newLng);
    setCoords(formatted);

    // Instant offline fallback name
    const quickMatch = getClosestOfflineLocation(newLat, newLng);
    setLocation(quickMatch);
    setGeospatialOrigin(quickMatch);

    setIsGeocodingLoading(true);
    try {
      const resolvedName = await reverseGeocodeCoords(newLat, newLng);
      if (resolvedName) {
        setLocation(resolvedName);
        setGeospatialOrigin(resolvedName);
      }
    } catch {
      // Keep offline name
    } finally {
      setIsGeocodingLoading(false);
    }
  }, []);

  // Initialize interactive location picker map when on 'map' tab
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = lat || 36.8065;
    const initialLng = lng || 10.1815;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: true,
    });

    const tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    // Custom Draggable Pin
    const customPinIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(0, 229, 255, 0.4); border-radius: 50%; animation: ping 1.5s infinite;"></div>
          <div style="background: #00A6D6; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
            📍
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const marker = L.marker([initialLat, initialLng], {
      icon: customPinIcon,
      draggable: true
    }).addTo(map);

    markerRef.current = marker;

    // On marker drag end: Automatically update coordinates and location name
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      handleUpdateCoordinates(position.lat, position.lng);
    });

    // On map click: Move marker and automatically update location name
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      handleUpdateCoordinates(clickLat, clickLng);
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, isLight, handleUpdateCoordinates, lat, lng]);

  // Handle preset location pick
  const handleSelectPreset = (preset: typeof QUICK_LOCATIONS[0]) => {
    setLocation(preset.name);
    setGeospatialOrigin(preset.name);
    setLat(preset.lat);
    setLng(preset.lng);
    setCoords(formatGpsCoordinates(preset.lat, preset.lng));

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 13);
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }
  };

  // Browser Geolocation Detection
  const handleDetectCurrentLocation = () => {
    if ('geolocation' in navigator) {
      setIsGeocodingLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const uLat = pos.coords.latitude;
          const uLng = pos.coords.longitude;
          if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.flyTo([uLat, uLng], 14);
            markerRef.current.setLatLng([uLat, uLng]);
          }
          handleUpdateCoordinates(uLat, uLng);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsGeocodingLoading(false);
        },
        { timeout: 8000 }
      );
    }
  };

  // Handle location text search
  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocationQuery) return;

    // Check if query is raw GPS coordinates
    const parsedCoords = parseGpsInput(searchLocationQuery);
    if (parsedCoords) {
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.flyTo([parsedCoords.lat, parsedCoords.lng], 13);
        markerRef.current.setLatLng([parsedCoords.lat, parsedCoords.lng]);
      }
      handleUpdateCoordinates(parsedCoords.lat, parsedCoords.lng);
      return;
    }

    // Otherwise check offline match or Nominatim geocoding
    const offlineMatch = QUICK_LOCATIONS.find(l => 
      l.name.toLowerCase().includes(searchLocationQuery.toLowerCase())
    );

    if (offlineMatch) {
      handleSelectPreset(offlineMatch);
    } else {
      setIsGeocodingLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocationQuery)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const foundLat = parseFloat(data[0].lat);
            const foundLng = parseFloat(data[0].lon);
            if (mapInstanceRef.current && markerRef.current) {
              mapInstanceRef.current.flyTo([foundLat, foundLng], 13);
              markerRef.current.setLatLng([foundLat, foundLng]);
            }
            handleUpdateCoordinates(foundLat, foundLng);
          }
        })
        .catch(err => console.warn('Search geocoding error:', err))
        .finally(() => setIsGeocodingLoading(false));
    }
  };

  // Audio Selection & Drag/Drop
  const handleAudioFileSelect = (file: File) => {
    if (!file) return;
    setAudioFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setAudioFileSize(`${sizeInMB} MB`);
    setIsAudioUploaded(true);
    setAudioFileBlob(file);

    const objectUrl = URL.createObjectURL(file);
    setAudioUrl(objectUrl);
    stopSynthAudio();
    startSynthAudio(soundType, previewVolume, objectUrl);
    setIsPlayingPreview(true);
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Toggle Live Audio Preview
  const handleTogglePlay = () => {
    if (isPlayingPreview) {
      stopSynthAudio();
      setIsPlayingPreview(false);
    } else {
      startSynthAudio(soundType, previewVolume, audioUrl || sound.audioUrl);
      setIsPlayingPreview(true);
    }
  };

  // Image Selection & Drag/Drop with Optimization
  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    setImageFileName(file.name);
    const sizeInKB = Math.round(file.size / 1024);
    setImageFileSize(`${sizeInKB} KB`);
    setIsImageUploaded(true);

    try {
      const optimized = await optimizeImageFile(file, 800, 800, 0.82);
      setImage(optimized.dataUrl);
      setImageFileBlob(optimized.blob);
    } catch (err) {
      console.warn('Image optimization fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      setImageFileBlob(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle Genre Change
  const handleGenreChange = (newType: SoundType) => {
    setSoundType(newType);
    const genreObj = ACOUSTIC_GENRES.find(g => g.id === newType);
    if (genreObj) {
      // Suggest category classification
      setClassification(genreObj.category);
    }
    if (isPlayingPreview && !audioUrl) {
      stopSynthAudio();
      startSynthAudio(newType, previewVolume);
    }
  };

  // Calculate Trim Duration
  const calculatedTrimDurationSec = Math.max(1, rightLocatorSec - leftLocatorSec);
  const newDurationStr = formatSecondsToMinutes(calculatedTrimDurationSec);

  // Form Submit / Save
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    stopSynthAudio();

    const startRatio = leftLocatorSec / totalLengthSec;
    const endRatio = rightLocatorSec / totalLengthSec;

    const updatedSoundItem: SoundItem = {
      ...sound,
      title: title.trim(),
      location: location.trim(),
      coords: coords.trim(),
      lat,
      lng,
      format,
      duration: newDurationStr || sound.duration,
      priceTND: Math.max(5, Number(priceTND) || sound.priceTND || 25),
      image: image || sound.image || ACOUSTIC_GENRES[0].defaultImage,
      description: description.trim() || sound.description,
      soundType,
      customGenre: soundType === 'custom' ? (customGenre.trim() || undefined) : (customGenre.trim() || undefined),
      audioUrl: audioUrl.trim() || sound.audioUrl,
      specimenId: specimenId.trim() || sound.specimenId || `#${Math.floor(1000 + Math.random() * 9000)}-S`,
      trimLocators: {
        startSec: parseFloat(leftLocatorSec.toFixed(2)),
        endSec: parseFloat(rightLocatorSec.toFixed(2)),
        startRatio: parseFloat(startRatio.toFixed(3)),
        endRatio: parseFloat(endRatio.toFixed(3))
      },
      organology: {
        classification: classification.trim() || sound.organology?.classification || 'Ethnomusicological Master',
        modalTaxonomy: modalTaxonomy.trim() || sound.organology?.modalTaxonomy || 'M7ayer 3RA9',
        geospatialOrigin: geospatialOrigin.trim() || location.trim(),
        acousticTrait: acousticTrait.trim() || `${format} 96kHz / 24-bit Master`
      }
    };

    setSaveSuccess(true);
    setTimeout(() => {
      onSave(updatedSoundItem, audioFileBlob || undefined, imageFileBlob || undefined);
      onClose();
    }, 450);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 font-mono-tech overflow-y-auto cursor-pointer animate-fadeIn"
      onClick={() => { stopSynthAudio(); onClose(); }}
    >
      <div 
        className={`max-w-4xl w-full rounded-2xl relative shadow-2xl transition-colors border p-5 md:p-7 my-auto max-h-[92vh] overflow-y-auto cursor-default ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B0E14] border-[#00A6D6]/40 text-[#dce4e5] shadow-[0_0_40px_rgba(0,166,214,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL TOP HEADER */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-5 ${
          isLight ? 'border-slate-200' : 'border-[#222B3D]'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#00A6D6]/15 text-[#00A6D6] border border-[#00A6D6]/40 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">tune</span>
                Édition & Traitement de Master
              </span>
              <span className="text-xs font-mono-tech text-[#C99738] font-bold">
                {specimenId}
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Modifier l'Enregistrement Sonore
            </h2>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              {location} • Format {format} • {newDurationStr}
            </p>
          </div>

          {/* Header Quick Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono-tech flex items-center gap-1.5 transition-all shadow-md ${
                isPlayingPreview
                  ? 'bg-[#D9532F] text-white shadow-[0_0_15px_rgba(217,83,47,0.4)]'
                  : 'bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] shadow-[0_0_15px_rgba(0,166,214,0.3)]'
              }`}
              title={isPlayingPreview ? "Arrêter la lecture" : "Écouter le son"}
            >
              <span className="material-symbols-outlined text-base">
                {isPlayingPreview ? 'pause' : 'play_arrow'}
              </span>
              <span>{isPlayingPreview ? 'Pause' : 'Écouter'}</span>
            </button>

            <button 
              onClick={() => { stopSynthAudio(); onClose(); }} 
              className={`p-2 rounded-xl transition-colors flex items-center justify-center ${
                isLight ? 'hover:bg-slate-100 text-slate-500 bg-slate-100/60' : 'hover:bg-[#222B3D] text-[#94A3B8] bg-[#131822] hover:text-white'
              }`}
              title="Fermer (Échap ou clic extérieur)"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>

        {/* 4 MAIN NAVIGATION TABS (Similar to Déposer un son, with complete content access) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 font-mono-tech text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 border text-center ${
              activeTab === 'map'
                ? 'bg-[#00A6D6] text-[#0B0E14] border-[#00A6D6] shadow-[0_0_15px_rgba(0,166,214,0.3)]'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#131822] border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/40'
            }`}
          >
            <span className="material-symbols-outlined text-base">map</span>
            <span>1. Carte & GPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 border text-center ${
              activeTab === 'audio'
                ? 'bg-[#00A6D6] text-[#0B0E14] border-[#00A6D6] shadow-[0_0_15px_rgba(0,166,214,0.3)]'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#131822] border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/40'
            }`}
          >
            <span className="material-symbols-outlined text-base">graphic_eq</span>
            <span>2. Audio & DAW</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 border text-center ${
              activeTab === 'metadata'
                ? 'bg-[#00A6D6] text-[#0B0E14] border-[#00A6D6] shadow-[0_0_15px_rgba(0,166,214,0.3)]'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#131822] border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/40'
            }`}
          >
            <span className="material-symbols-outlined text-base">auto_stories</span>
            <span>3. Organologie</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 border text-center ${
              activeTab === 'visual'
                ? 'bg-[#00A6D6] text-[#0B0E14] border-[#00A6D6] shadow-[0_0_15px_rgba(0,166,214,0.3)]'
                : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-[#131822] border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/40'
            }`}
          >
            <span className="material-symbols-outlined text-base">image</span>
            <span>4. Visuel & Prix</span>
          </button>
        </div>

        {/* TAB 1: CARTE & GÉOLOCALISATION GPS (Exact interactive map as Déposer un son) */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Search and Geolocation Controls */}
            <div className="flex flex-col sm:flex-row gap-2">
              <form onSubmit={handleSearchLocation} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-base text-[#94A3B8]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchLocationQuery}
                    onChange={(e) => setSearchLocationQuery(e.target.value)}
                    placeholder="Rechercher une ville, lieu ou coordonnées (ex: 36.8, 10.2)..."
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none font-mono-tech ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00A6D6]' 
                        : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isGeocodingLoading}
                  className="px-3.5 py-2 bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-bold rounded-xl text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Aller</span>
                </button>
              </form>

              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                disabled={isGeocodingLoading}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-[#131822] hover:bg-[#1E2738] border-[#222B3D] text-[#00A6D6]'
                }`}
                title="Détecter automatiquement ma position GPS"
              >
                <span className="material-symbols-outlined text-base">my_location</span>
                <span className="hidden sm:inline">Ma Position GPS</span>
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-2">
                ⚡ Préréglages Rapides du Patrimoine Maghrébin :
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_LOCATIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      location.includes(preset.name.split(',')[0])
                        ? 'bg-[#00A6D6]/20 border-[#00A6D6] text-[#00A6D6] font-bold shadow-sm'
                        : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                          : 'bg-[#131822]/80 border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/40'
                    }`}
                  >
                    📍 {preset.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div className="relative rounded-2xl overflow-hidden border border-[#222B3D] shadow-inner bg-[#0c131d]">
              <div 
                ref={mapContainerRef} 
                className="w-full h-64 sm:h-80 z-10" 
                style={{ minHeight: '260px' }}
              />
              
              {/* Overlay Status Badge */}
              <div className="absolute top-3 right-3 z-[400] bg-[#0B0E14]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#00A6D6]/40 text-[#00A6D6] text-[11px] font-mono-tech flex items-center gap-2 shadow-lg">
                <span className={`w-2 h-2 rounded-full ${isGeocodingLoading ? 'bg-[#D9532F] animate-ping' : 'bg-[#00e5ff]'}`} />
                <span>{isGeocodingLoading ? 'Géocodage inverse...' : 'Glissez le repère 📍'}</span>
              </div>
            </div>

            {/* Location and Coords Manual Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-1">
                  Nom du Territoire / Emplacement *
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setGeospatialOrigin(e.target.value);
                  }}
                  required
                  placeholder="Ex: Tunis Médina, Tunisie"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00A6D6]' 
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-1">
                  Coordonnées GPS Actuelles
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coords}
                    onChange={(e) => setCoords(e.target.value)}
                    placeholder="36.8065° N, 10.1815° E"
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00A6D6]' 
                        : 'bg-[#131822] border-[#222B3D] text-[#00A6D6] focus:border-[#00A6D6]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseGpsInput(coords);
                      if (parsed) {
                        handleUpdateCoordinates(parsed.lat, parsed.lng);
                        if (mapInstanceRef.current && markerRef.current) {
                          mapInstanceRef.current.flyTo([parsed.lat, parsed.lng], 13);
                          markerRef.current.setLatLng([parsed.lat, parsed.lng]);
                        }
                      }
                    }}
                    className="px-3 py-2 bg-[#00A6D6]/15 hover:bg-[#00A6D6] text-[#00A6D6] hover:text-[#0B0E14] border border-[#00A6D6]/40 rounded-xl text-xs font-bold transition-colors shrink-0"
                    title="Valider et centrer la carte sur ces coordonnées"
                  >
                    Centrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AUDIO, FICHIER & LOCATEURS DAW */}
        {activeTab === 'audio' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Audio Drag and Drop Replacement Area */}
            <div>
              <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-2">
                Remplacer le Fichier Audio Master (.wav, .mp3, .flac, .ambisonic)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingAudio(true); }}
                onDragLeave={() => setIsDraggingAudio(false)}
                onDrop={handleAudioDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingAudio
                    ? 'border-[#00A6D6] bg-[#00A6D6]/10 scale-[1.01]'
                    : isLight
                      ? 'border-slate-300 hover:border-[#00A6D6] bg-slate-50 hover:bg-white'
                      : 'border-[#222B3D] hover:border-[#00A6D6]/60 bg-[#131822]/60 hover:bg-[#131822]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.mp3,.flac,.ogg,.amb"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleAudioFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-3xl text-[#00A6D6]">
                    cloud_upload
                  </span>
                  <div className="text-xs">
                    <span className="font-bold text-[#00A6D6]">Cliquez pour téléverser</span> ou glissez-déposez le fichier audio master
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Formats acceptés : WAV 96kHz/24-bit, MP3 320kbps, FLAC, Ambisonique B-Format
                  </p>
                </div>
              </div>
            </div>

            {/* Current Audio File Details & URL Fallback */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00A6D6]/15 border border-[#00A6D6]/40 flex items-center justify-center text-[#00A6D6] shrink-0">
                  <span className="material-symbols-outlined text-xl">audiotrack</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{audioFileName || (audioUrl ? 'Fichier Audio Actif' : 'Générateur de Synthèse Intégré')}</span>
                    {audioFileSize && (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#00A6D6]/20 text-[#00A6D6] border border-[#00A6D6]/30">
                        {audioFileSize}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#94A3B8] truncate max-w-md">
                    {audioUrl ? audioUrl : 'Audio synthétisé temps-réel conforme au genre sélectionné'}
                  </p>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="material-symbols-outlined text-sm text-[#94A3B8]">volume_up</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={previewVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setPreviewVolume(vol);
                    if (isPlayingPreview) {
                      startSynthAudio(soundType, vol, audioUrl || sound.audioUrl);
                    }
                  }}
                  className="w-20 accent-[#00A6D6]"
                  title="Volume de pré-écoute"
                />
              </div>
            </div>

            {/* Direct Audio URL field */}
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                Lien / URL Audio Externe Directe
              </label>
              <input
                type="text"
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
                placeholder="https://example.com/audio/master.wav ou blob local"
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00A6D6]' 
                    : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                }`}
              />
            </div>

            {/* WAVEFORM CANVAS & DAW TRIMMING LOCATORS */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#00A6D6]/20 text-[#00A6D6] font-bold flex items-center gap-1 border border-[#00A6D6]/40">
                    <span className="w-2 h-2 rounded-full bg-[#00A6D6] animate-pulse" />
                    In: {formatSecondsToTime(leftLocatorSec)}
                  </span>
                  <span className="text-[#94A3B8]">→</span>
                  <span className="px-2.5 py-1 rounded bg-[#C99738]/20 text-[#C99738] font-bold flex items-center gap-1 border border-[#C99738]/40">
                    <span className="w-2 h-2 rounded-full bg-[#C99738]" />
                    Out: {formatSecondsToTime(rightLocatorSec)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#94A3B8]">
                    Durée taillée : <strong className="text-white font-mono">{newDurationStr}</strong> ({calculatedTrimDurationSec.toFixed(1)}s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLeftLocatorSec(0);
                      setRightLocatorSec(totalLengthSec);
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors border border-white/10"
                    title="Réinitialiser les locateurs sur la pleine durée du master"
                  >
                    Pleine durée
                  </button>
                </div>
              </div>

              {/* Interactive Waveform Canvas */}
              <div className="rounded-xl p-2.5 bg-[#0B0E14] border border-[#222B3D] shadow-inner">
                <AudioWaveformCanvas
                  soundId={sound.id}
                  soundType={soundType}
                  duration={sound.duration}
                  isPlaying={isPlayingPreview}
                  theme={settings.theme}
                  height={50}
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

              {/* Sliders for In/Out locators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#222B3D]/60 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#00A6D6] uppercase mb-1">
                    Locateur Début (In) : {formatSecondsToTime(leftLocatorSec)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={Math.max(1, rightLocatorSec - 0.5)}
                    step="0.1"
                    value={leftLocatorSec}
                    onChange={(e) => setLeftLocatorSec(parseFloat(e.target.value))}
                    className="w-full accent-[#00A6D6]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#C99738] uppercase mb-1">
                    Locateur Fin (Out) : {formatSecondsToTime(rightLocatorSec)}
                  </label>
                  <input
                    type="range"
                    min={leftLocatorSec + 0.5}
                    max={totalLengthSec}
                    step="0.1"
                    value={rightLocatorSec}
                    onChange={(e) => setRightLocatorSec(parseFloat(e.target.value))}
                    className="w-full accent-[#C99738]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MÉTADONNÉES, CLIMAT ACOUSTIQUE & ORGANOLOGIE */}
        {activeTab === 'metadata' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Title */}
            <div>
              <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-1">
                Titre de l'Enregistrement Sonore *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Ex: Medina Morning Call - Tunis"
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none font-bold ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00A6D6]' 
                    : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                }`}
              />
            </div>

            {/* Acoustic Genre Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-2">
                Type Sonore & Climat Acoustique (13 Préréglages Patrimoniaux)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ACOUSTIC_GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => handleGenreChange(genre.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      soundType === genre.id
                        ? 'bg-[#00A6D6]/15 border-[#00A6D6] text-white shadow-md'
                        : isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-[#00A6D6]/50'
                          : 'bg-[#131822] border-[#222B3D] text-[#94A3B8] hover:text-white hover:border-[#00A6D6]/30'
                    }`}
                  >
                    <span className="text-xs font-bold truncate block">{genre.label}</span>
                    <span className="text-[10px] text-[#94A3B8] truncate block mt-0.5">{genre.category}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Genre if custom */}
            {(soundType === 'custom' || customGenre) && (
              <div>
                <label className="block text-[11px] font-bold text-[#C99738] uppercase tracking-wider mb-1">
                  Intitulé du Genre Personnalisé
                </label>
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Ex: Rituel Stambeli / Cloche Pastorale du Tell"
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-800' 
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#C99738]'
                  }`}
                />
              </div>
            )}

            {/* Modal Taxonomy & Organology Sachs-Hornbostel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Modal Taxonomy / Maqam */}
              <div>
                <label className="block text-[11px] font-bold text-[#C99738] uppercase tracking-wider mb-1">
                  Taxonomie Modale / Tubu' / Maqâm
                </label>
                <input
                  type="text"
                  value={modalTaxonomy}
                  onChange={(e) => setModalTaxonomy(e.target.value)}
                  placeholder="Ex: M7ayer 3RA9, Rast, Maya, Isba'yn..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none font-bold ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-[#131822] border-[#222B3D] text-[#C99738] focus:border-[#C99738]'
                  }`}
                />
                {/* Modal Taxonomy Suggestions Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_MODAL_TAXONOMIES.slice(0, 8).map((tax) => (
                    <button
                      key={tax}
                      type="button"
                      onClick={() => setModalTaxonomy(tax)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        modalTaxonomy === tax
                          ? 'bg-[#C99738] text-[#0B0E14] font-bold border-[#C99738]'
                          : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {tax}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classification Organologique */}
              <div>
                <label className="block text-[11px] font-bold text-[#C99738] uppercase tracking-wider mb-1">
                  Classification Organologique & Milieu
                </label>
                <input
                  type="text"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="Ex: Organologie & Cordes, Aérophones..."
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#C99738]'
                  }`}
                />
                {/* Classification Chips */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_ORGANOLOGY_CLASSES.slice(0, 5).map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => setClassification(cls)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        classification === cls
                          ? 'bg-[#00A6D6] text-[#0B0E14] font-bold border-[#00A6D6]'
                          : 'bg-white/5 border-white/10 text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      {cls.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Acoustic Traits / Microphones & Recording Chain */}
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                Trait Acoustique & Matériel de Captation
              </label>
              <input
                type="text"
                value={acousticTrait}
                onChange={(e) => setAcousticTrait(e.target.value)}
                placeholder="Ex: Microphones Ambisoniques Sennheiser AMBEO VR, Zoom F8n Pro 32-bit Float"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-800' 
                    : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                }`}
              />
            </div>

            {/* Ethnomusicological Description */}
            <div>
              <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-1">
                Notice & Description Culturelle / Ethnomusicologique
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez avec précision les conditions d'enregistrement, le contexte historique, les interprètes, l'acoustique de la pièce ou du paysage naturel..."
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none font-sans text-xs leading-relaxed ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#00A6D6]'
                    : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                }`}
              />
            </div>
          </div>
        )}

        {/* TAB 4: POCHETTE, FORMAT AUDIO & TARIFICATION */}
        {activeTab === 'visual' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Visual Image Upload / Drag & Drop */}
            <div>
              <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-2">
                Pochette / Vignette Visuelle (WebP, JPG, PNG)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={handleImageDrop}
                onClick={() => imageFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                  isDraggingImage
                    ? 'border-[#00A6D6] bg-[#00A6D6]/10 scale-[1.01]'
                    : isLight
                      ? 'border-slate-300 hover:border-[#00A6D6] bg-slate-50 hover:bg-white'
                      : 'border-[#222B3D] hover:border-[#00A6D6]/60 bg-[#131822]/60 hover:bg-[#131822]'
                }`}
              >
                <input
                  ref={imageFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  {image ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-[#00A6D6]/40 relative group">
                      <img src={image} alt="Vignette" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] transition-opacity font-bold">
                        Remplacer
                      </div>
                    </div>
                  ) : (
                    <span className="material-symbols-outlined text-3xl text-[#00A6D6]">add_photo_alternate</span>
                  )}
                  <div className="text-xs">
                    <span className="font-bold text-[#00A6D6]">Cliquez pour sélectionner une photo</span> ou glissez-déposez
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Image automatiquement optimisée et enregistrée en haute résolution
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Image URL input */}
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                Ou Lien / URL Visuelle Externe
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#00A6D6]' 
                    : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                }`}
              />
            </div>

            {/* Quick Artwork Preset Suggestions */}
            <div>
              <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Galerie de Préréglages Visuels d'Ambiance :
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {ACOUSTIC_GENRES.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setImage(item.defaultImage)}
                    className={`rounded-xl overflow-hidden border transition-all relative aspect-video group ${
                      image === item.defaultImage
                        ? 'border-[#00A6D6] ring-2 ring-[#00A6D6]'
                        : 'border-[#222B3D] hover:border-white/40'
                    }`}
                  >
                    <img src={item.defaultImage} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[9px] text-white font-bold truncate">{item.label.split(' ')[0]}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Format, Pricing, Specimen ID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#222B3D]/60">
              {/* Audio Format Master */}
              <div>
                <label className="block text-[11px] font-bold text-[#00A6D6] uppercase tracking-wider mb-1">
                  Format Audio Master
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as AudioFormat)}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs border outline-none font-bold ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                  }`}
                >
                  <option value="3D Spatial">3D Spatial (Ambisonic B-Format)</option>
                  <option value="Stereo">Stereo Master 96kHz / 24-bit</option>
                  <option value="Ambisonic">Ambisonic Quad-Channel 3D</option>
                  <option value="Binaural">Binaural 3D Immersion</option>
                </select>
              </div>

              {/* Price TND */}
              <div>
                <label className="block text-[11px] font-bold text-[#C99738] uppercase tracking-wider mb-1">
                  Tarif Catalogue (Dinars Tunisiens TND)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="500"
                    step="1"
                    value={priceTND}
                    onChange={(e) => setPriceTND(Number(e.target.value))}
                    required
                    className={`w-full pl-3 pr-14 py-2.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                      isLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900' 
                        : 'bg-[#131822] border-[#222B3D] text-[#C99738] focus:border-[#C99738]'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-[#C99738]">
                    TND
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  ≈ {(priceTND * 0.32).toFixed(1)} USD • {(priceTND * 0.30).toFixed(1)} EUR
                </p>
              </div>

              {/* Specimen / Archive ID */}
              <div>
                <label className="block text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                  Identifiant Spécimen d'Archive
                </label>
                <input
                  type="text"
                  value={specimenId}
                  onChange={(e) => setSpecimenId(e.target.value)}
                  placeholder="#4092-A"
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-mono border outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-800' 
                      : 'bg-[#131822] border-[#222B3D] text-white focus:border-[#00A6D6]'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOOTER & ACTION BUTTONS */}
        <div className={`mt-6 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isLight ? 'border-slate-200' : 'border-[#222B3D]'
        }`}>
          {/* Tab Navigation Shortcuts */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab !== 'map' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'visual') setActiveTab('metadata');
                  else if (activeTab === 'metadata') setActiveTab('audio');
                  else if (activeTab === 'audio') setActiveTab('map');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-[#131822] hover:bg-[#222B3D] text-[#94A3B8] hover:text-white border-[#222B3D]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                <span>Précédent</span>
              </button>
            )}

            {activeTab !== 'visual' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'map') setActiveTab('audio');
                  else if (activeTab === 'audio') setActiveTab('metadata');
                  else if (activeTab === 'metadata') setActiveTab('visual');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#00A6D6]/15 hover:bg-[#00A6D6] text-[#00A6D6] hover:text-[#0B0E14] border border-[#00A6D6]/40 transition-colors flex items-center gap-1"
              >
                <span>Suivant</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
          </div>

          {/* Save and Cancel Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => { stopSynthAudio(); onClose(); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-[#94A3B8] hover:text-white hover:bg-[#131822]'
              }`}
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={saveSuccess}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold font-mono-tech uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] shadow-[0_0_20px_rgba(0,166,214,0.35)]'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {saveSuccess ? 'check_circle' : 'save'}
              </span>
              <span>{saveSuccess ? 'Modifications Enregistrées !' : 'Enregistrer les Modifications'}</span>
            </button>
          </div>
        </div>

        {/* Persistence Notice */}
        <div className="mt-3 pt-2 text-center text-[10px] text-[#64748B] flex items-center justify-center gap-1.5 font-mono-tech">
          <span className="material-symbols-outlined text-xs text-[#00A6D6]">cloud_done</span>
          <span>Stockage pérenne IndexedDB & synchronisation automatique avec le catalogue audio.</span>
        </div>
      </div>
    </div>
  );
};
