import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SoundItem, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';
import { togglePlayState } from '../services/audioSynth';
import { EditSoundModal } from './EditSoundModal';

interface ExplorerViewProps {
  sounds: SoundItem[];
  selectedSound: SoundItem | null;
  onSelectSound: (sound: SoundItem) => void;
  onAddToCart: (item: { id: string; title: string; subtitle: string; priceUSD: number; type: 'sound' }) => void;
  onOpenDepositModal: () => void;
  onNavigateToMarketplace?: () => void;
  settings: UserSettings;
  isAdminAuthenticated?: boolean;
  onDeleteSound?: (soundId: string) => void;
  onUpdateSound?: (sound: SoundItem, audioBlob?: Blob, imageBlob?: Blob) => void;
}

// Popular locations for quick map navigation
const MAP_LOCATIONS = [
  { name: 'Sousse', lat: 35.8256, lng: 10.6369 },
  { name: 'Tunis', lat: 36.8065, lng: 10.1815 },
  { name: 'Djerba', lat: 33.8076, lng: 10.8451 },
  { name: 'Algiers', lat: 36.7853, lng: 3.0600 },
  { name: 'Casablanca', lat: 33.5731, lng: -7.5898 },
  { name: 'Marrakech', lat: 31.6295, lng: -7.9811 },
  { name: 'Tripoli', lat: 32.8872, lng: 13.1913 }
];

export const ExplorerView: React.FC<ExplorerViewProps> = ({
  sounds,
  selectedSound,
  onSelectSound,
  onAddToCart,
  onOpenDepositModal,
  onNavigateToMarketplace,
  settings,
  isAdminAuthenticated,
  onDeleteSound,
  onUpdateSound
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const isLight = settings.theme === 'light';

  // State for sound to edit modal
  const [soundToEdit, setSoundToEdit] = useState<SoundItem | null>(null);

  // Map state
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>(isLight ? 'streets' : 'dark');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>({ lat: 35.8256, lng: 10.6369 });
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(true);
  const [isCardVisible, setIsCardVisible] = useState(true);

  // Auto show card when selected sound changes
  useEffect(() => {
    if (selectedSound) {
      setIsCardVisible(true);
    }
  }, [selectedSound]);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const formatPrice = (priceTND: number) => {
    if (settings.currency === 'USD') return `$${(priceTND * 0.32).toFixed(2)}`;
    if (settings.currency === 'EUR') return `€${(priceTND * 0.30).toFixed(2)}`;
    return `${priceTND.toFixed(2)} TND`;
  };

  // Get tile URL for map style
  const getTileUrl = (style: 'streets' | 'satellite' | 'dark') => {
    if (style === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (style === 'streets') {
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [34.5, 8.5], // Centered on North Africa
        zoom: 6,
        zoomControl: false,
      });

      const tileLayer = L.tileLayer(getTileUrl(mapStyle), {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO & Esri',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Track cursor position
      map.on('mousemove', (e: L.LeafletMouseEvent) => {
        setCursorCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      mapInstanceRef.current = map;
    }

    // Force map resize check
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);
  }, []);

  // Synchronize Map with Day (light) and Night (dark) mode
  useEffect(() => {
    setMapStyle(settings.theme === 'light' ? 'streets' : 'dark');
  }, [settings.theme]);

  // Update Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(getTileUrl(mapStyle), {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO & Esri',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTileLayer;
  }, [mapStyle]);

  // Handle Sound Markers render & update
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    Object.values(markersRef.current).forEach((m: L.Marker) => m.remove());
    markersRef.current = {};

    sounds.forEach((s) => {
      const isSelected = selectedSound?.id === s.id;

      let colorHex = '#00e5ff';
      if (s.format === 'Stereo') colorHex = '#4edea3';
      if (s.format === 'Ambisonic') colorHex = '#fd6c00';

      const customIcon = L.divIcon({
        className: 'custom-sound-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${colorHex}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: ${colorHex}; border: 2px solid ${isSelected ? '#ffffff' : '#020912'}; box-shadow: 0 0 12px ${colorHex}; display: flex; align-items: center; justify-content: center; transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'}; transition: transform 0.2s;">
              <span style="font-size: 10px; color: #020912; font-weight: 800;">♪</span>
            </div>
            <div style="margin-top: 4px; background: rgba(2, 9, 18, 0.85); color: #ffffff; padding: 2px 6px; border-radius: 4px; border: 1px solid ${colorHex}; font-size: 10px; white-space: nowrap; font-family: monospace; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              ${s.title}
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 25]
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        onSelectSound(s);
        map.flyTo([s.lat, s.lng], Math.max(map.getZoom(), 11), { duration: 1 });
      });

      markersRef.current[s.id] = marker;
    });
  }, [sounds, selectedSound]);

  // Handle Fly to searched location
  const handleSearchLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchLocation || !mapInstanceRef.current) return;

    const matchedSound = sounds.find(s => 
      s.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
      s.title.toLowerCase().includes(searchLocation.toLowerCase())
    );

    if (matchedSound) {
      onSelectSound(matchedSound);
      mapInstanceRef.current.flyTo([matchedSound.lat, matchedSound.lng], 12, { duration: 1.2 });
      return;
    }

    const matchedPreset = MAP_LOCATIONS.find(l => l.name.toLowerCase().includes(searchLocation.toLowerCase()));
    if (matchedPreset) {
      mapInstanceRef.current.flyTo([matchedPreset.lat, matchedPreset.lng], 12, { duration: 1.2 });
    }
  };

  const handleFlyToPreset = (loc: typeof MAP_LOCATIONS[0]) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 12, { duration: 1.2 });
    }
  };

  const handleTogglePreview = (sound: SoundItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectSound(sound);
    const active = togglePlayState(sound.soundType, 0.85);
    setIsPlayingPreview(active);
    setActivePreviewId(active ? sound.id : null);
  };

  const activeSound = selectedSound || sounds[0];

  return (
    <div className={`relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] max-w-full overflow-hidden transition-colors ${
      isLight ? 'bg-slate-100' : 'bg-[#020912]'
    }`}>
      {/* Full-bleed Leaflet Map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* TOP SCIENTIFIC ATLAS CONTEXT BANNER */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 max-w-full">
          {/* Academic / Scientific Badge */}
          <div className={`p-2.5 px-3.5 rounded-xl border backdrop-blur-md shadow-lg pointer-events-auto flex items-center justify-between md:justify-start gap-3 transition-colors ${
            isLight ? 'bg-white/95 border-slate-300 text-slate-800' : 'bg-[#0c131d]/95 border-[#00e5ff]/40 text-white'
          }`}>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#0099b8]/15 dark:bg-[#00e5ff]/20 text-[#0099b8] dark:text-[#00e5ff] flex items-center">
                <span className="material-symbols-outlined text-base">school</span>
              </span>
              <div>
                <h2 className="text-xs font-bold font-mono-tech flex items-center gap-2">
                  <span>ATLAS GÉO-ACOUSTIQUE & RECHERCHE SCIENTIFIQUE</span>
                  <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-[#00e5ff] font-bold">
                    Éducatif & Ethnomusicologie
                  </span>
                </h2>
                <p className={`text-[10px] hidden sm:block ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
                  Relevés GPS de terrain • Préservation du patrimoine immatériel • Organologie & Taxonomie
                </p>
              </div>
            </div>

            {/* Jump to Marketplace button */}
            {onNavigateToMarketplace && (
              <button
                onClick={onNavigateToMarketplace}
                className="px-2.5 py-1.5 rounded-lg bg-[#fd6c00] hover:bg-[#ff8a33] text-white text-[11px] font-bold font-mono-tech flex items-center gap-1 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">storefront</span>
                <span className="hidden md:inline">Boutique</span> (3 Clics)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TOP MAP CONTROLS OVERLAY */}
      <div className="absolute top-18 sm:top-20 left-3 sm:left-4 right-3 sm:right-4 z-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 sm:gap-3 pointer-events-none">
        
        {/* Search Bar & Quick Fly Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto max-w-xl w-full">
          <form onSubmit={handleSearchLocation} className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#0099b8] dark:text-[#00e5ff]">
              travel_explore
            </span>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              placeholder="Rechercher sur la carte (ex: Sousse, Tunis, Djerba)..."
              className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs font-mono-tech outline-none shadow-lg backdrop-blur-md transition-all ${
                isLight 
                  ? 'bg-white/95 border-slate-300 text-slate-800 focus:border-[#0099b8]' 
                  : 'bg-[#0c131d]/95 border-[#00e5ff]/40 text-white focus:border-[#00e5ff]'
              }`}
            />
          </form>

          {/* Quick Preset Location Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto py-1">
            {MAP_LOCATIONS.slice(0, 4).map((loc) => (
              <button
                key={loc.name}
                onClick={() => handleFlyToPreset(loc)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border font-mono-tech backdrop-blur-md transition-all shadow-xs ${
                  isLight 
                    ? 'bg-white/90 border-slate-300 text-slate-700 hover:bg-[#0099b8] hover:text-white' 
                    : 'bg-[#0c131d]/90 border-[#1a2635] text-[#bac9cc] hover:border-[#00e5ff] hover:text-[#00e5ff]'
                }`}
              >
                📍 {loc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right Top Actions: Add Sound Button & Map Layer Switcher */}
        <div className="flex items-center gap-2 pointer-events-auto ml-auto">
          {/* Map Layer Switcher */}
          <div className={`flex rounded-lg border overflow-hidden p-0.5 shadow-lg backdrop-blur-md ${
            isLight ? 'bg-white/95 border-slate-300' : 'bg-[#0c131d]/95 border-[#1a2635]'
          }`}>
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 font-mono-tech transition-all ${
                mapStyle === 'streets'
                  ? isLight ? 'bg-[#0099b8] text-white' : 'bg-[#00e5ff] text-[#001f24]'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-[#8b9a9d] hover:text-white'
              }`}
              title="Vue Plan Google Maps"
            >
              <span className="material-symbols-outlined text-xs">map</span>
              Plan
            </button>

            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 font-mono-tech transition-all ${
                mapStyle === 'satellite'
                  ? isLight ? 'bg-[#0099b8] text-white' : 'bg-[#00e5ff] text-[#001f24]'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-[#8b9a9d] hover:text-white'
              }`}
              title="Vue Satellite Haute Résolution"
            >
              <span className="material-symbols-outlined text-xs">satellite_alt</span>
              Satellite
            </button>

            <button
              onClick={() => setMapStyle('dark')}
              className={`px-2.5 py-1 text-[10px] font-bold rounded flex items-center gap-1 font-mono-tech transition-all ${
                mapStyle === 'dark'
                  ? isLight ? 'bg-[#0099b8] text-white' : 'bg-[#00e5ff] text-[#001f24]'
                  : isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-[#8b9a9d] hover:text-white'
              }`}
              title="Mode Nuit"
            >
              <span className="material-symbols-outlined text-xs">dark_mode</span>
              Nuit
            </button>
          </div>

          {/* Add Sound Modal Button */}
          <button
            onClick={onOpenDepositModal}
            className="bg-[#fd6c00] hover:bg-[#ff8a33] text-white font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-lg shadow-lg transition-all text-xs uppercase tracking-wider font-mono-tech"
          >
            <span className="material-symbols-outlined text-sm">add_location_alt</span>
            <span className="hidden sm:inline">{t.addSound}</span>
          </button>
        </div>
      </div>

      {/* FLOATING ZOOM & NAVIGATION CONTROLS */}
      <div className="absolute bottom-12 right-4 z-20 flex flex-col gap-2 font-mono-tech">
        <div className={`flex flex-col rounded-lg border overflow-hidden shadow-xl backdrop-blur-md ${
          isLight ? 'bg-white/95 border-slate-300' : 'bg-[#0c131d]/95 border-[#1a2635]'
        }`}>
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className={`p-2.5 flex justify-center transition-colors border-b ${
              isLight ? 'border-slate-200 text-slate-700 hover:bg-slate-100' : 'border-[#1a2635] text-[#bac9cc] hover:text-[#00e5ff]'
            }`}
            title="Zoom +"
          >
            <span className="material-symbols-outlined text-sm">add</span>
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className={`p-2.5 flex justify-center transition-colors ${
              isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-[#bac9cc] hover:text-[#00e5ff]'
            }`}
            title="Zoom -"
          >
            <span className="material-symbols-outlined text-sm">remove</span>
          </button>
        </div>

        <button
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([34.5, 8.5], 6);
            }
          }}
          className={`p-2.5 rounded-lg border flex justify-center shadow-xl backdrop-blur-md transition-colors ${
            isLight ? 'bg-white/95 border-slate-300 text-slate-700 hover:bg-slate-100' : 'bg-[#0c131d]/95 border-[#1a2635] text-[#bac9cc] hover:text-[#00e5ff]'
          }`}
          title="Réinitialiser la vue Carte"
        >
          <span className="material-symbols-outlined text-sm">filter_center_focus</span>
        </button>
      </div>

      {/* SELECTED SOUND POPUP CARD OVERLAY */}
      {activeSound && isCardVisible && (
        <div className={`absolute bottom-22 sm:bottom-8 left-2 sm:left-4 z-20 max-w-[calc(100vw-4.5rem)] sm:max-w-sm w-full md:w-96 rounded-xl border p-3 sm:p-4 shadow-2xl backdrop-blur-md font-mono-tech transition-all animate-fadeIn ${
          isLight 
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50' 
            : 'bg-[#0c131d]/95 border-[#00e5ff]/50 text-[#dce4e5] shadow-[0_0_25px_rgba(0,229,255,0.25)]'
        }`}>
          {/* Card Image Banner */}
          <div className="relative h-28 w-full rounded-lg overflow-hidden mb-3 group">
            <img 
              src={activeSound.image} 
              alt={activeSound.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <span className="absolute top-2 left-2 bg-[#020912]/80 backdrop-blur-md text-[#00e5ff] text-[10px] font-bold px-2 py-0.5 rounded border border-[#00e5ff]/30">
              {activeSound.format}
            </span>

            {/* Toggle Close / Hide button */}
            <button
              onClick={() => setIsCardVisible(false)}
              className="absolute top-2 right-2 bg-black/75 hover:bg-[#fd6c00] text-white rounded-full p-1 border border-white/20 transition-all flex items-center justify-center shadow-lg group-hover:scale-110"
              title="Masquer la fiche son (Cliquez pour fermer)"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>

            <span className="absolute top-2 right-9 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#fd6c00]">timer</span>
              {activeSound.duration}
            </span>

            <div className="absolute bottom-2 left-2 right-2 text-white">
              <h3 className="font-bold text-sm truncate font-display">{activeSound.title}</h3>
              <p className="text-[11px] text-slate-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-[#fd6c00]">location_on</span>
                {activeSound.location}
              </p>
            </div>
          </div>

          {/* Sound Details Grid */}
          <div className={`space-y-1.5 text-[11px] mb-3 pb-2 border-b ${isLight ? 'border-slate-200' : 'border-[#1a2635]'}`}>
            <div className="flex justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}>COORDONNÉES:</span>
              <span className="font-bold">{activeSound.coords}</span>
            </div>
            <div className="flex justify-between">
              <span className={isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}>TAXO MODALE:</span>
              <span className="text-[#0099b8] dark:text-[#00e5ff] font-bold">{activeSound.organology?.modalTaxonomy || 'Folk Modal'}</span>
            </div>
          </div>

          {/* Mini Waveform Visualizer */}
          <div className={`h-8 w-full border rounded flex items-center justify-between px-2 space-x-[2px] mb-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020912] border-[#1a2635]'
          }`}>
            {[4, 8, 6, 11, 4, 9, 6, 12, 7, 5, 9, 6, 8, 4, 10, 7].map((val, i) => (
              <div
                key={i}
                className={`w-1 rounded-t transition-all ${
                  isPlayingPreview && activePreviewId === activeSound.id
                    ? 'bg-[#0099b8] dark:bg-[#00e5ff] animate-pulse'
                    : 'bg-[#0099b8]/40 dark:bg-[#00e5ff]/40'
                }`}
                style={{ height: `${val * 2.2}px` }}
              />
            ))}
          </div>

          {/* Price & Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <span className={`font-bold text-xs px-2.5 py-1 rounded border ${
              isLight 
                ? 'bg-slate-100 border-slate-200 text-[#0099b8]' 
                : 'bg-[#1a2635] border-[#253548] text-[#00e5ff]'
            }`}>
              {formatPrice(activeSound.priceTND)}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleTogglePreview(activeSound, e)}
                className="bg-[#0099b8] dark:bg-[#00e5ff] text-white dark:text-[#001f24] text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1.5 hover:opacity-90 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">
                  {isPlayingPreview && activePreviewId === activeSound.id ? 'pause' : 'play_arrow'}
                </span>
                {isPlayingPreview && activePreviewId === activeSound.id ? 'PAUSE' : 'ÉCOUTER'}
              </button>

              <button
                onClick={() => onAddToCart({
                  id: activeSound.id,
                  title: activeSound.title,
                  subtitle: activeSound.location,
                  priceUSD: Math.round(activeSound.priceTND * 0.32),
                  type: 'sound'
                })}
                className="bg-[#D4AF37] hover:bg-[#B8952B] text-[#12131C] text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                title="Ajouter au Panier"
              >
                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                <span>PANIER</span>
              </button>

              <button
                onClick={() => setSoundToEdit(activeSound)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition-all ${
                  isLight
                    ? 'bg-cyan-50 hover:bg-cyan-100 text-[#008ba3] border-cyan-300'
                    : 'bg-[#00A6D6]/15 hover:bg-[#00A6D6] text-[#00A6D6] hover:text-[#0B0E14] border-[#00A6D6]/40'
                }`}
                title="Modifier et traiter cet enregistrement sonore (GPS, Audio, Pochette, Métadonnées)"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>ÉDITER</span>
              </button>

              {isAdminAuthenticated && (
                <button
                  onClick={() => {
                    if (onDeleteSound && window.confirm(`[ADMIN] Confirmer la suppression définitive de « ${activeSound.title} » ?`)) {
                      onDeleteSound(activeSound.id);
                      setIsCardVisible(false);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                  title="[ADMIN] Supprimer le son"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MINIMIZED SOUND CARD TOGGLE BUTTON */}
      {activeSound && !isCardVisible && (
        <button
          onClick={() => setIsCardVisible(true)}
          className={`absolute bottom-8 left-4 z-20 px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md font-mono-tech text-xs flex items-center gap-3 transition-all hover:scale-105 active:scale-95 ${
            isLight 
              ? 'bg-white/95 border-slate-300 text-slate-900 hover:border-[#0099b8]' 
              : 'bg-[#0c131d]/95 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)]'
          }`}
          title="Cliquez pour faire réapparaître la fiche détaillée du son"
        >
          <span className="material-symbols-outlined text-lg text-[#fd6c00]">
            graphic_eq
          </span>
          <div className="flex flex-col text-left">
            <span className="font-bold text-xs truncate max-w-[180px]">{activeSound.title}</span>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
              {activeSound.location} • Afficher la fiche
            </span>
          </div>
          <span className="material-symbols-outlined text-sm bg-[#0099b8]/10 dark:bg-[#00e5ff]/10 p-1 rounded-full text-[#0099b8] dark:text-[#00e5ff]">
            visibility
          </span>
        </button>
      )}

      {/* BOTTOM REAL-TIME GPS COORDINATES BAR */}
      <div className={`absolute bottom-2 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-1 rounded-md text-[10px] font-mono-tech border backdrop-blur-md shadow-md ${
        isLight ? 'bg-white/90 border-slate-300 text-slate-700' : 'bg-[#0c131d]/90 border-[#1a2635] text-[#8b9a9d]'
      }`}>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#0099b8] dark:bg-[#00e5ff] animate-ping" />
          <span className="font-bold">GPS GOOGLE MAPS PRÉCISION:</span>
        </div>
        {cursorCoords && (
          <span>
            LAT: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{cursorCoords.lat.toFixed(5)}° N</strong> | 
            LNG: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{cursorCoords.lng.toFixed(5)}° E</strong>
          </span>
        )}
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
            if (selectedSound?.id === updated.id) {
              onSelectSound(updated);
            }
            setSoundToEdit(null);
          }}
        />
      )}
    </div>
  );
};
