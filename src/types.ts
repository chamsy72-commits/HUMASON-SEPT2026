export type AppTab = 'library' | 'explorer' | 'packs' | 'pro' | 'contributors' | 'admin' | 'anthropology' | 'settings';

export type Language = 'FR' | 'EN' | 'AR';
export type Currency = 'EUR' | 'TND' | 'USD';
export type AudioFormat = 'Stereo' | '3D Spatial' | 'Ambisonic';

export type SoundType =
  | 'oud'
  | 'desert'
  | 'medina'
  | 'bendir'
  | 'coastal'
  | 'nay'
  | 'mezwed'
  | 'darbuka'
  | 'malouf'
  | 'gnawa'
  | 'oasis'
  | 'biophony'
  | 'custom'
  | string;

export interface TrimLocators {
  startSec: number; // Left locator in seconds
  endSec: number;   // Right locator in seconds
  startRatio?: number; // 0..1
  endRatio?: number;   // 0..1
}

export interface SoundItem {
  id: string;
  title: string;
  location: string;
  coords: string;
  lat: number;
  lng: number;
  format: AudioFormat;
  duration: string;
  priceTND: number;
  image: string;
  description: string;
  soundType: SoundType;
  audioUrl?: string;
  customGenre?: string;
  specimenId?: string;
  trimLocators?: TrimLocators;
  organology?: {
    classification: string;
    modalTaxonomy?: string;
    geospatialOrigin: string;
    acousticTrait?: string;
  };
}

export interface ThematicPack {
  id: string;
  title: string;
  badge: string;
  badgeType: 'verified' | 'atmos' | 'spatial';
  description: string;
  spec: string;
  priceUSD: number;
  image: string;
  tracksCount: number;
}

export interface EnterpriseTier {
  id: string;
  title: string;
  priceUSD: number | string;
  period: string;
  features: string[];
  recommended?: boolean;
}

export interface Transaction {
  id: string;
  invCode: string;
  title: string;
  date: string;
  amountUSD: number;
  status: 'PAID' | 'PENDING' | 'FAILED';
  type: 'subscription' | 'pack' | 'sound';
}

export interface CartItem {
  id: string;
  title: string;
  subtitle: string;
  priceUSD: number;
  type: 'pack' | 'sound' | 'plan';
}

export interface UserProfile {
  name: string;
  id: string;
  avatar: string;
  role: string;
  vaultUsedGB: number;
  vaultMaxGB: number;
  planName: string;
  planPriceUSD: number;
  nextRenewal: string;
  paymentCardLast4: string;
}

export interface UserSettings {
  language: Language;
  currency: Currency;
  theme: 'dark' | 'light';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  unitSystem: 'Metric' | 'Imperial';
  highResStreaming: boolean;
  autoPlay: boolean;
  spatialAudio: boolean;
  twoFactorAuth: boolean;
  publicAnalytics: boolean;
}
