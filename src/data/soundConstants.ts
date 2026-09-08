import { SoundType } from '../types';

export interface QuickLocation {
  name: string;
  lat: number;
  lng: number;
}

// Preset locations for quick snapping
export const QUICK_LOCATIONS: QuickLocation[] = [
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

export interface AcousticGenreConfig {
  id: SoundType;
  label: string;
  category: string;
  defaultImage: string;
  defaultDuration: string;
}

// Rich acoustic genres with presets & default artwork
export const ACOUSTIC_GENRES: AcousticGenreConfig[] = [
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

// Tunisian Tubu' and Maghrebi Maqamat
export const COMMON_MODAL_TAXONOMIES = [
  'M7ayer 3RA9',
  'Rast',
  'Maya',
  'Isba\'yn',
  'Sikah',
  'Bayati',
  'Hijaz',
  'Husseini',
  'Raml al-Maya',
  'Mazmoum',
  'Nawa',
  'Kurdi',
  'Stambeli Gnaoui',
  'Chant Liturgique Soufi'
];

// Sachs-Hornbostel and Acoustical classifications
export const COMMON_ORGANOLOGY_CLASSES = [
  'Organologie & Cordes (Cordophones)',
  'Instruments à Vent (Aérophones)',
  'Percussions Dynamiques (Membranophones)',
  'Percussions & Entrecroisements (Idiophones)',
  'Patrimoine Urbain & Médina (Soundscape)',
  'Environnement Marin & Côtes (Hydro-acoustique)',
  'Désert & Dunes (Éolien & Silence)',
  'Bio-acoustique Sauvage & Oiseaux',
  'Musique Savante & Malouf Tunisien',
  'Musique Populaire & Mezwed',
  'Rituel Sacré & Confrérie Soufie'
];
