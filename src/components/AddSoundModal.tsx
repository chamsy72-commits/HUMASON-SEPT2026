import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AudioFormat, SoundItem, SoundType, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { reverseGeocodeCoords, formatGpsCoordinates, parseGpsInput, getClosestOfflineLocation } from '../services/geoService';
import { startSynthAudio, stopSynthAudio } from '../services/audioSynth';
import { AudioWaveformCanvas } from './AudioWaveformCanvas';

interface AddSoundModalProps {
  settings: UserSettings;
  onClose: () => void;
  onAddSound: (newSound: SoundItem) => void;
}

// Preset locations for quick snapping
const QUICK_LOCATIONS = [
  { name: 'Bizerte (Cap Blanc), Tunisia', lat: 37.2744, lng: 9.8739 },
  { name: 'Tunis Médina, Tunisia', lat: 36.7992, lng: 10.1706 },
  { name: 'Sidi Bou Said, Tunisia', lat: 36.8703, lng: 10.3417 },
  { name: 'Sousse (Ribat & Médina), Tunisia', lat: 35.8256, lng: 10.6369 },
  { name: 'Djerba (Houmt Souk), Tunisia', lat: 33.8076, lng: 10.8451 },
  { name: 'Tozeur (Chott El Djérid), Tunisia', lat: 33.9197, lng: 8.1335 },
  { name: 'Sfax (Médina & Port), Tunisia', lat: 34.7406, lng: 10.7603 },
  { name: 'Kairouan, Tunisia', lat: 35.6781, lng: 10.0963 },
  { name: 'Casbah d\'Alger, Algérie', lat: 36.7853, lng: 3.0600 },
  { name: 'Marrakech (Médina), Maroc', lat: 31.6295, lng: -7.9811 }
];

// Rich acoustic genres with presets & default artwork
const ACOUSTIC_GENRES: {
  id: SoundType;
  label: string;
  category: string;
  defaultImage: string;
  defaultDuration: string;
}[] = [
  {
    id: 'coastal',
    label: '🌊 Vagues Côtières & Brise Méditerranéenne',
    category: 'Environnement Marin',
    defaultImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '04:15'
  },
  {
    id: 'medina',
    label: '🕌 Ambiance & Ruelles de la Médina',
    category: 'Patrimoine Urbain',
    defaultImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '05:30'
  },
  {
    id: 'oud',
    label: '🎻 Oud Arbi & Cordes Traditionnelles',
    category: 'Organologie & Cordes',
    defaultImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '03:45'
  },
  {
    id: 'nay',
    label: '🪈 Flûte Nay & Souffle Soufi',
    category: 'Instruments à Vent',
    defaultImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '04:50'
  },
  {
    id: 'mezwed',
    label: '🎺 Mezwed & Cornemuse Populaire',
    category: 'Tradition Populaire',
    defaultImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '03:20'
  },
  {
    id: 'darbuka',
    label: '🪘 Darbuka & Rythmes Maqsum',
    category: 'Percussions Dynamiques',
    defaultImage: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '02:55'
  },
  {
    id: 'bendir',
    label: '🥁 Bendir & Rituels Soufis',
    category: 'Musique Sacrée & Transe',
    defaultImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '06:10'
  },
  {
    id: 'malouf',
    label: '🎼 Chant & Orchestre Malouf Andalous',
    category: 'Musique Savante',
    defaultImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '05:12'
  },
  {
    id: 'gnawa',
    label: '🪕 Guembri & Transe Gnawa / Stambali',
    category: 'Patrimoine Rhapsodique',
    defaultImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '07:40'
  },
  {
    id: 'desert',
    label: '🏜️ Dunes & Silence du Sahara',
    category: 'Paysage Acoustique Désert',
    defaultImage: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '08:00'
  },
  {
    id: 'oasis',
    label: '🌴 Sources d\'Eau & Palmiers d\'Oasis',
    category: 'Hydro-acoustique',
    defaultImage: 'https://images.unsplash.com/photo-1518457607834-6e8d80c183c5?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '04:30'
  },
  {
    id: 'biophony',
    label: '🦩 Bio-acoustique & Faune d\'Ichkeul',
    category: 'Bio-acoustique Sauvage',
    defaultImage: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '06:45'
  },
  {
    id: 'custom',
    label: '✨ Profil Personnalisé / Prise de Son Directe',
    category: 'Captation Libre',
    defaultImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    defaultDuration: '04:00'
  }
];

export const AddSoundModal: React.FC<AddSoundModalProps> = ({
  settings,
  onClose,
  onAddSound
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const isLight = settings.theme === 'light';

  // Step 1: GPS & Location, Step 2: Audio & Technical specs
  const [step, setStep] = useState<1 | 2>(1);

  // Sound Metadata States
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Bizerte (Cap Blanc), Tunisia');
  const [coords, setCoords] = useState('37.2744° N, 9.8739° E');
  const [lat, setLat] = useState(37.2744);
  const [lng, setLng] = useState(9.8739);
  const [format, setFormat] = useState<AudioFormat>('3D Spatial');
  const [duration, setDuration] = useState('04:15');
  const [priceTND, setPriceTND] = useState(25.0);
  const [description, setDescription] = useState('');
  const [soundType, setSoundType] = useState<SoundType>('coastal');
  const [customGenre, setCustomGenre] = useState('');
  const [image, setImage] = useState(ACOUSTIC_GENRES[0].defaultImage);
  const [searchLocationQuery, setSearchLocationQuery] = useState('');
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Audio File Upload & Live Preview States
  const [audioFileName, setAudioFileName] = useState<string>('bizerte_cap_blanc_master_96khz.wav');
  const [audioFileSize, setAudioFileSize] = useState<string>('32.4 MB');
  const [isAudioUploaded, setIsAudioUploaded] = useState<boolean>(true);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string>('');
  const [audioUrlInput, setAudioUrlInput] = useState<string>('');
  const [isDraggingAudio, setIsDraggingAudio] = useState<boolean>(false);

  // Pre-upload Audio Preview Playback State
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);
  const [previewVolume, setPreviewVolume] = useState<number>(0.85);

  // Small Size & Lightweight Image Upload States
  const [imageFileName, setImageFileName] = useState<string>('vignette_vagues_bizerte.webp');
  const [imageFileSize, setImageFileSize] = useState<string>('38 KB');
  const [isImageUploaded, setIsImageUploaded] = useState<boolean>(true);
  const [isDraggingImage, setIsDraggingImage] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Stop preview audio when modal unmounts
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

    setIsGeocodingLoading(true);
    try {
      const resolvedName = await reverseGeocodeCoords(newLat, newLng);
      if (resolvedName) {
        setLocation(resolvedName);
      }
    } catch {
      // Keep offline name
    } finally {
      setIsGeocodingLoading(false);
    }
  }, []);

  // Initialize interactive location picker map in Step 1
  useEffect(() => {
    if (step !== 1 || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initialLat = lat;
    const initialLng = lng;

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
          <div style="background: #fd6c00; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
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

    // On marker drag end: Automatically update location name
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
  }, [step, isLight, handleUpdateCoordinates]);

  // Handle preset location pick
  const handleSelectPreset = (preset: typeof QUICK_LOCATIONS[0]) => {
    setLocation(preset.name);
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

    const match = QUICK_LOCATIONS.find(l => 
      l.name.toLowerCase().includes(searchLocationQuery.toLowerCase())
    );

    if (match) {
      handleSelectPreset(match);
    } else {
      // Freeform search
      setLocation(searchLocationQuery);
    }
  };

  // GPS Input Manual Change Handler
  const handleManualCoordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCoords(val);
    const parsed = parseGpsInput(val);
    if (parsed) {
      setLat(parsed.lat);
      setLng(parsed.lng);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.panTo([parsed.lat, parsed.lng]);
        markerRef.current.setLatLng([parsed.lat, parsed.lng]);
      }
      handleUpdateCoordinates(parsed.lat, parsed.lng);
    }
  };

  // Audio File Selection Handler
  const handleAudioFileSelect = (file: File) => {
    if (!file) return;
    setAudioFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setAudioFileSize(`${sizeInMB} MB`);
    setIsAudioUploaded(true);

    // Create readable object URL for instant pre-listening
    const objectUrl = URL.createObjectURL(file);
    setAudioBlobUrl(objectUrl);

    // If auto-guessing title from file name
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_|-]+/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    if (file.name.endsWith('.wav')) setFormat('3D Spatial');
    if (file.name.endsWith('.amb')) setFormat('Ambisonic');

    // Auto trigger pre-listen preview
    stopSynthAudio();
    startSynthAudio(soundType, previewVolume, objectUrl);
    setIsPreviewPlaying(true);
  };

  const handleAudioFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAudioFileSelect(e.target.files[0]);
    }
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingAudio(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAudioFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Pre-upload Audio Preview Toggle
  const handleTogglePreUploadPreview = () => {
    if (isPreviewPlaying) {
      stopSynthAudio();
      setIsPreviewPlaying(false);
    } else {
      const targetAudio = audioBlobUrl || (audioUrlInput.trim().length > 0 ? audioUrlInput : undefined);
      startSynthAudio(soundType, previewVolume, targetAudio);
      setIsPreviewPlaying(true);
    }
  };

  // Image Selection Handler (optimizing thumbnail)
  const handleImageFileSelect = (file: File) => {
    if (!file) return;
    setImageFileName(file.name);
    const sizeInKB = Math.round(file.size / 1024);
    setImageFileSize(`${sizeInKB} KB`);
    setIsImageUploaded(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFileSelect(e.target.files[0]);
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
      setImage(genreObj.defaultImage);
      setDuration(genreObj.defaultDuration);
    }
    // If currently previewing synthesized sound, restart with new type
    if (isPreviewPlaying && !audioBlobUrl && !audioUrlInput) {
      stopSynthAudio();
      startSynthAudio(newType, previewVolume);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    stopSynthAudio();

    const selectedGenreMeta = ACOUSTIC_GENRES.find(g => g.id === soundType);
    const effectiveAudioUrl = audioBlobUrl || (audioUrlInput.trim().length > 0 ? audioUrlInput : undefined);

    const newSoundItem: SoundItem = {
      id: `sound-${Date.now()}`,
      title: title.trim(),
      location: location.trim(),
      coords: coords.trim(),
      lat,
      lng,
      format,
      duration: duration.trim() || '04:20',
      priceTND: Number(priceTND) || 20.0,
      image: image || ACOUSTIC_GENRES[0].defaultImage,
      description: description.trim() || `Enregistrement sonore master capté avec précision à ${location}. Archive certifiée haute fidélité.`,
      soundType,
      customGenre: soundType === 'custom' ? customGenre : undefined,
      audioUrl: effectiveAudioUrl,
      specimenId: `#${Math.floor(1000 + Math.random() * 9000)}-S`,
      organology: {
        classification: selectedGenreMeta ? selectedGenreMeta.category : 'Acoustic Environment / Field Recording',
        modalTaxonomy: soundType === 'custom' && customGenre ? customGenre : (selectedGenreMeta ? selectedGenreMeta.label.split(' ')[1] : 'Regional Master'),
        geospatialOrigin: location,
        acousticTrait: `${format} 96kHz / 24-bit Microphonic Master`
      }
    };

    onAddSound(newSoundItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 font-mono-tech overflow-y-auto">
      <div className={`max-w-2xl w-full rounded-2xl relative shadow-2xl transition-colors border p-5 md:p-6 my-auto max-h-[92vh] overflow-y-auto ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0a121c] border-[#00e5ff]/40 text-[#dce4e5]'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-start border-b pb-4 mb-4 ${isLight ? 'border-slate-200' : 'border-[#1a2635]'}`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-[#fd6c00]">sound_detection_loud_sound</span>
              <h2 className={`text-xl font-bold font-display tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t.depositArtifact}
              </h2>
            </div>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#00e5ff]'}`}>
              {step === 1 ? "Étape 1 : Pointez le lieu sur la carte pour synchroniser le nom et GPS" : "Étape 2 : Pré-écoutez et complétez les métadonnées audio"}
            </p>
          </div>
          <button 
            onClick={() => { stopSynthAudio(); onClose(); }} 
            className={`p-1.5 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-[#1a2635] text-[#6b7a7d]'}`}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Workflow Step Tabs */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              step === 1
                ? isLight 
                  ? 'bg-[#0099b8] text-white border-[#0099b8] shadow-sm'
                  : 'bg-[#00e5ff] text-[#001f24] border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-[#1a2635] text-[#8b9a9d] border-[#253548]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">map</span>
            1. Localisation GPS & Nom du Lieu
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
              step === 2
                ? isLight 
                  ? 'bg-[#0099b8] text-white border-[#0099b8] shadow-sm'
                  : 'bg-[#00e5ff] text-[#001f24] border-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                : isLight
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-[#1a2635] text-[#8b9a9d] border-[#253548]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">headphones</span>
            2. Pré-écoute & Dépôt Audio
          </button>
        </div>

        {/* STEP 1: Interactive Google Maps Style Location Picker */}
        {step === 1 && (
          <div className="space-y-3.5">
            {/* Search Bar & Auto-Detect Button */}
            <div className="flex gap-2">
              <form onSubmit={handleSearchLocation} className="relative flex-1">
                <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-slate-400' : 'text-[#6b7a7d]'}`}>
                  search
                </span>
                <input
                  type="text"
                  value={searchLocationQuery}
                  onChange={(e) => setSearchLocationQuery(e.target.value)}
                  placeholder="Rechercher une ville, lieu ou coller coordonnées GPS..."
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#030d1a] border-[#1a2635] text-white'
                  }`}
                />
              </form>
              <button
                type="button"
                onClick={handleDetectCurrentLocation}
                title="Détecter automatiquement ma position GPS actuelle"
                className="bg-[#0099b8] dark:bg-[#00e5ff] text-white dark:text-[#001f24] font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 hover:opacity-90 transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                GPS Direct
              </button>
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className={`text-[10px] uppercase font-bold mr-1 ${isLight ? 'text-slate-400' : 'text-[#6b7a7d]'}`}>
                Raccourcis:
              </span>
              {QUICK_LOCATIONS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => handleSelectPreset(loc)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                    location.includes(loc.name.split(' ')[0])
                      ? isLight ? 'bg-[#0099b8] text-white border-[#0099b8]' : 'bg-[#00e5ff]/20 text-[#00e5ff] border-[#00e5ff]'
                      : isLight ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200' : 'bg-[#1a2635]/60 text-[#8b9a9d] border-[#253548] hover:text-white'
                  }`}
                >
                  {loc.name.split(',')[0]}
                </button>
              ))}
            </div>

            {/* Map Canvas */}
            <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-[#1a2635] h-64 w-full">
              <div ref={mapContainerRef} className="w-full h-full z-0" />

              {/* Dynamic Location Pin Feedback Banner */}
              <div className={`absolute bottom-3 left-3 right-3 z-10 p-2.5 rounded-xl backdrop-blur-md border text-xs flex items-center justify-between shadow-lg ${
                isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0c131d]/95 border-[#00e5ff]/40 text-[#00e5ff]'
              }`}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-xl text-[#fd6c00] animate-bounce shrink-0">place</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold block text-[12px] truncate">{location}</span>
                      {isGeocodingLoading && (
                        <span className="text-[9px] bg-[#00e5ff]/20 text-[#00e5ff] px-1.5 py-0.2 rounded animate-pulse">
                          Sync GPS...
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] opacity-85 font-mono-tech">{coords}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-[#fd6c00]/15 text-[#fd6c00] font-bold px-2 py-1 rounded-md border border-[#fd6c00]/30 shrink-0">
                  ✓ Point GPS Validé
                </span>
              </div>
            </div>

            {/* Direct Inputs for Location Name & GPS Details (Always in sync) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className={`block text-xs mb-1 font-bold flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  <span>Nom du Lieu</span>
                  <span className="text-[10px] text-[#0099b8] dark:text-[#00e5ff] font-normal">Auto-synchronisé avec le repère</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Nom de la ville, oasis ou monument..."
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 font-bold flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  <span>Coordonnées GPS</span>
                  <span className="text-[10px] text-[#fd6c00] font-normal">Édition libre supportée</span>
                </label>
                <input
                  type="text"
                  required
                  value={coords}
                  onChange={handleManualCoordsChange}
                  placeholder="ex: 37.2744° N, 9.8739° E"
                  className={`w-full p-2.5 rounded-lg border text-xs font-mono-tech outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-[#0099b8] dark:bg-[#00e5ff] text-white dark:text-[#001f24] font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all mt-3 shadow-md hover:opacity-95"
            >
              Suivant: Détails & Pré-écoute du Son
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: Audio Metadata, File Upload & Pre-Listen Preview */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sound Title */}
            <div>
              <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                Titre de l'Artefact Sonore
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex: Bizerte Cap Blanc Wave Resonance & Ocean Wind"
                className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                }`}
              />
            </div>

            {/* Acoustic Profile / Genre Selection (Rich List) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs mb-1 font-bold flex items-center justify-between ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  <span>Profil Acoustique / Genre</span>
                  <span className="text-[10px] text-[#0099b8] dark:text-[#00e5ff]">13 profils ethnomusicologiques</span>
                </label>
                <select
                  value={soundType}
                  onChange={(e) => handleGenreChange(e.target.value as SoundType)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                >
                  {ACOUSTIC_GENRES.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>

              {soundType === 'custom' ? (
                <div>
                  <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                    Nom du Genre Personnalisé
                  </label>
                  <input
                    type="text"
                    required
                    value={customGenre}
                    onChange={(e) => setCustomGenre(e.target.value)}
                    placeholder="ex: Qanun Soliste, Chant Polyphonique..."
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                    }`}
                  />
                </div>
              ) : (
                <div>
                  <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                    Format d'Enregistrement
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as AudioFormat)}
                    className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                    }`}
                  >
                    <option value="3D Spatial">3D Spatial (Binaural Master)</option>
                    <option value="Ambisonic">Ambisonic (Full Spherical B-Format)</option>
                    <option value="Stereo">Stereo Master (96kHz / 24-bit)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Prix Unitaire (TND)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={priceTND}
                  onChange={(e) => setPriceTND(parseFloat(e.target.value))}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Durée (mm:ss)
                </label>
                <input
                  type="text"
                  required
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                />
              </div>
            </div>

            {/* PRE-UPLOAD AUDIO PLAYER (LISTEN BEFORE UPLOADING) */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#030d1a] border-[#00e5ff]/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00e5ff] text-base">headphones</span>
                  <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Écoute de Contrôle Avant Dépôt
                  </span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono-tech ${
                  isPreviewPlaying
                    ? 'bg-[#fd6c00]/20 text-[#fd6c00] border border-[#fd6c00]/40 animate-pulse'
                    : 'bg-slate-200 dark:bg-[#1a2635] text-slate-600 dark:text-[#8b9a9d]'
                }`}>
                  {isPreviewPlaying ? '▶ Lecture En Cours' : '⏸ En Pause'}
                </span>
              </div>

              {/* Player Row with Play/Pause & Live Canvas Waveform */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTogglePreUploadPreview}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 transition-all shadow-md ${
                    isPreviewPlaying
                      ? 'bg-[#fd6c00] text-white hover:bg-[#ff8a33]'
                      : 'bg-[#0099b8] dark:bg-[#00e5ff] text-white dark:text-[#001f24] hover:opacity-90'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {isPreviewPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                <div className="flex-1 bg-black/40 rounded-lg p-1.5 border border-white/10 min-w-0">
                  <AudioWaveformCanvas
                    soundId="pre-upload-preview"
                    soundType={soundType}
                    duration={duration}
                    isPlaying={isPreviewPlaying}
                    theme="dark"
                    height={28}
                    barWidth={2.5}
                    barGap={1.5}
                  />
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="material-symbols-outlined text-xs text-slate-400">volume_up</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={previewVolume}
                    onChange={(e) => setPreviewVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 accent-[#00e5ff] cursor-pointer"
                  />
                </div>
              </div>
              <p className={`text-[10px] mt-2 ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
                {audioBlobUrl 
                  ? "✓ Vous écoutez le fichier audio local que vous venez de charger." 
                  : "✓ Aperçu du profil acoustique sélectionné. Glissez votre propre fichier ci-dessous pour l'écouter."}
              </p>
            </div>

            {/* AUDIO FILE UPLOAD DROPZONE */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-bold flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-[#00e5ff]'}`}>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">cloud_upload</span>
                  Fichier Audio Master (.wav, .flac, .amb, .mp3)
                </span>
                <span className="text-[10px] text-[#fd6c00] font-mono-tech font-bold uppercase">
                  Requis pour l'Archivage
                </span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.flac,.amb,.ogg,.m4a"
                className="hidden"
                onChange={handleAudioFileInputChange}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingAudio(true); }}
                onDragLeave={() => setIsDraggingAudio(false)}
                onDrop={handleAudioDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col md:flex-row items-center justify-between gap-3 ${
                  isDraggingAudio
                    ? 'border-[#00e5ff] bg-[#00e5ff]/10 scale-[1.01]'
                    : isAudioUploaded
                      ? isLight
                        ? 'border-[#0099b8] bg-[#0099b8]/5 hover:bg-[#0099b8]/10'
                        : 'border-[#00e5ff]/50 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/10'
                      : isLight
                        ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                        : 'border-[#1a2635] bg-[#030d1a] hover:bg-[#0c131d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isAudioUploaded 
                      ? 'bg-[#0099b8]/20 dark:bg-[#00e5ff]/20 text-[#0099b8] dark:text-[#00e5ff]' 
                      : 'bg-slate-200 dark:bg-[#1a2635] text-slate-500 dark:text-[#8b9a9d]'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {isAudioUploaded ? 'audio_file' : 'upload_file'}
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {audioFileName || "Glissez-déposez votre fichier son ici"}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
                      {isAudioUploaded 
                        ? `Format: ${format} • Taille: ${audioFileSize} • Prêt pour archivage` 
                        : "WAV 24-bit / 96kHz, MP3, FLAC, Ambisonic. Cliquez pour parcourir."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isLight 
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                      : 'bg-[#1a2635] text-[#00e5ff] hover:bg-[#253548] border border-[#00e5ff]/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">folder_open</span>
                  Parcourir...
                </button>
              </div>

              {/* Direct Stream URL input */}
              <div className="pt-0.5">
                <input
                  type="url"
                  value={audioUrlInput}
                  onChange={(e) => setAudioUrlInput(e.target.value)}
                  placeholder="Ou collez un lien URL direct du flux audio (ex: https://.../sample.wav)"
                  className={`w-full p-2 rounded-lg border text-[11px] font-mono-tech outline-none ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                  }`}
                />
              </div>
            </div>

            {/* LIGHTWEIGHT IMAGE UPLOAD DROPZONE */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#1a2635]">
              <label className={`block text-xs font-bold flex items-center justify-between ${isLight ? 'text-slate-700' : 'text-[#00e5ff]'}`}>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                  Image Vignette du Son (Petite Taille & Qualité Web)
                </span>
                <span className="text-[10px] text-[#0099b8] dark:text-[#00e5ff] font-mono-tech font-bold uppercase">
                  Format Léger (&lt; 2 MB)
                </span>
              </label>

              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/jpg, image/gif"
                className="hidden"
                onChange={handleImageFileInputChange}
              />

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingImage(true); }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={handleImageDrop}
                onClick={() => imageFileInputRef.current?.click()}
                className={`p-3 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col md:flex-row items-center justify-between gap-3 ${
                  isDraggingImage
                    ? 'border-[#fd6c00] bg-[#fd6c00]/10 scale-[1.01]'
                    : isImageUploaded
                      ? isLight
                        ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100/50'
                        : 'border-[#00e5ff]/40 bg-[#00e5ff]/5 hover:bg-[#00e5ff]/10'
                      : isLight
                        ? 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                        : 'border-[#1a2635] bg-[#030d1a] hover:bg-[#0c131d]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {image ? (
                    <img
                      src={image}
                      alt="Thumbnail Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-white/30 shadow-md shrink-0"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                      isLight ? 'bg-slate-200 text-slate-500' : 'bg-[#1a2635] text-[#8b9a9d]'
                    }`}>
                      <span className="material-symbols-outlined text-xl">image</span>
                    </div>
                  )}

                  <div>
                    <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {imageFileName || "Glissez une vignette d'illustration"}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
                      {isImageUploaded
                        ? `Vignette active • Taille: ${imageFileSize} (Optimisée Web)`
                        : "JPG, PNG, WEBP. Glissez l'image ou cliquez pour parcourir."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    imageFileInputRef.current?.click();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isLight 
                      ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' 
                      : 'bg-[#1a2635] text-[#00e5ff] hover:bg-[#253548] border border-[#00e5ff]/30'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">photo_library</span>
                  Changer l'image...
                </button>
              </div>
            </div>

            {/* Field Notes */}
            <div>
              <label className={`block text-xs mb-1 font-bold ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                Notes Ethnographiques de Terrain
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Microphones utilisés, heure de la journée, conditions acoustiques..."
                className={`w-full p-2.5 rounded-lg border text-xs outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#030d1a] border-[#1a2635] text-[#dce4e5]'
                }`}
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-colors ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' : 'bg-[#1a2635] border-[#253548] text-[#bac9cc] hover:text-white'
                }`}
              >
                ← Retour à la Carte
              </button>
              <button
                type="submit"
                className="flex-2 bg-[#fd6c00] hover:bg-[#ff8a33] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">save</span>
                Enregistrer & Publier dans la Bibliothèque
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
