// Geographic location, reverse-geocoding, and GPS parsing service

export interface GeoLocationResult {
  name: string;
  city?: string;
  country?: string;
  formattedCoords: string;
  lat: number;
  lng: number;
}

// Extensive offline reference dataset for instant zero-latency location snapping
const KNOWN_GEO_POINTS = [
  // Tunisia - North & Coastal
  { name: 'Bizerte (Cap Blanc), Tunisia', lat: 37.2744, lng: 9.8739, radius: 0.25 },
  { name: 'Tabarka (Côte de Corail), Tunisia', lat: 36.9544, lng: 8.7580, radius: 0.25 },
  { name: 'Sidi Bou Said & Carthage, Tunisia', lat: 36.8703, lng: 10.3417, radius: 0.15 },
  { name: 'Tunis Médina, Tunisia', lat: 36.7992, lng: 10.1706, radius: 0.2 },
  { name: 'La Marsa & Gammarth, Tunisia', lat: 36.8782, lng: 10.3247, radius: 0.15 },
  { name: 'Kelibia & Cap Bon, Tunisia', lat: 36.8464, lng: 11.0939, radius: 0.25 },
  { name: 'Nabeul & Hammamet, Tunisia', lat: 36.4561, lng: 10.7376, radius: 0.25 },
  { name: 'Sousse (Ribat & Médina), Tunisia', lat: 35.8256, lng: 10.6369, radius: 0.2 },
  { name: 'Monastir (Marina & Ribat), Tunisia', lat: 35.7779, lng: 10.8262, radius: 0.18 },
  { name: 'Mahdia (Borj El Kebir), Tunisia', lat: 35.5047, lng: 11.0622, radius: 0.2 },
  { name: 'Kairouan (Grande Mosquée), Tunisia', lat: 35.6781, lng: 10.0963, radius: 0.25 },
  { name: 'Sfax (Médina & Port), Tunisia', lat: 34.7406, lng: 10.7603, radius: 0.25 },
  { name: 'Îles Kerkennah, Tunisia', lat: 34.7170, lng: 11.2000, radius: 0.3 },
  { name: 'Gabès (Oasis Maritime), Tunisia', lat: 33.8815, lng: 10.0982, radius: 0.25 },
  { name: 'Djerba (Houmt Souk & Midoun), Tunisia', lat: 33.8076, lng: 10.8451, radius: 0.3 },
  { name: 'Zarzis, Tunisia', lat: 33.5040, lng: 11.1122, radius: 0.25 },
  { name: 'Matmata (Habitations Troglodytes), Tunisia', lat: 33.5422, lng: 9.9714, radius: 0.25 },
  { name: 'Tataouine & Ksour, Tunisia', lat: 32.9297, lng: 10.4518, radius: 0.35 },
  { name: 'Douz (Porte du Sahara), Tunisia', lat: 33.4663, lng: 9.0203, radius: 0.35 },
  { name: 'Tozeur (Chott El Djérid), Tunisia', lat: 33.9197, lng: 8.1335, radius: 0.35 },
  { name: 'Nefta (Corbeille & Oasis), Tunisia', lat: 33.8731, lng: 7.8777, radius: 0.3 },
  { name: 'Gafsa & Oasis Historiques, Tunisia', lat: 34.4250, lng: 8.7842, radius: 0.3 },
  { name: 'El Jem (Amphithéâtre Romain), Tunisia', lat: 35.3000, lng: 10.7167, radius: 0.2 },
  { name: 'Béja, Tunisia', lat: 36.7256, lng: 9.1817, radius: 0.25 },
  { name: 'Le Kef (Kasbah), Tunisia', lat: 36.1742, lng: 8.7049, radius: 0.25 },
  { name: 'Parc National de l\'Ichkeul, Tunisia', lat: 37.1667, lng: 9.6667, radius: 0.25 },
  
  // Algeria
  { name: 'Casbah d\'Alger, Algérie', lat: 36.7853, lng: 3.0600, radius: 0.3 },
  { name: 'Oran (Santa Cruz), Algérie', lat: 35.6987, lng: -0.6349, radius: 0.3 },
  { name: 'Constantine (Ponts Suspendus), Algérie', lat: 36.3650, lng: 6.6147, radius: 0.3 },
  { name: 'Annaba (Hippone), Algérie', lat: 36.9000, lng: 7.7667, radius: 0.3 },
  { name: 'Ghardaïa (Vallée du M\'Zab), Algérie', lat: 32.4909, lng: 3.6736, radius: 0.35 },
  { name: 'Tamanrasset (Hoggar), Algérie', lat: 22.7850, lng: 5.5228, radius: 0.8 },
  
  // Morocco
  { name: 'Marrakech (Médina & Jemaa el-Fna), Maroc', lat: 31.6295, lng: -7.9811, radius: 0.3 },
  { name: 'Casablanca (Hassan II), Maroc', lat: 33.5731, lng: -7.5898, radius: 0.3 },
  { name: 'Fès el-Bali, Maroc', lat: 34.0592, lng: -4.9780, radius: 0.3 },
  { name: 'Tanger (Cap Spartel), Maroc', lat: 35.7595, lng: -5.8340, radius: 0.3 },
  { name: 'Chefchaouen (Ville Bleue), Maroc', lat: 35.1688, lng: -5.2636, radius: 0.25 },
  { name: 'Essaouira (Mogador), Maroc', lat: 31.5085, lng: -9.7595, radius: 0.3 },
  { name: 'Merzouga (Dunes Erg Chebbi), Maroc', lat: 31.0994, lng: -4.0125, radius: 0.4 },

  // Libya & Mediterranean
  { name: 'Tripoli (Médina Ancienne), Libye', lat: 32.8872, lng: 13.1913, radius: 0.4 },
  { name: 'Benghazi, Libye', lat: 32.1167, lng: 20.0667, radius: 0.4 },
  { name: 'Ghadamès (Perle du Désert), Libye', lat: 30.1333, lng: 9.5000, radius: 0.4 },
  { name: 'La Valette, Malte', lat: 35.8989, lng: 14.5146, radius: 0.2 },
  { name: 'Palerme, Sicile', lat: 38.1157, lng: 13.3615, radius: 0.3 }
];

export function formatGpsCoordinates(lat: number, lng: number): string {
  const latCard = lat >= 0 ? 'N' : 'S';
  const lngCard = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latCard}, ${Math.abs(lng).toFixed(4)}° ${lngCard}`;
}

export function parseGpsInput(input: string): { lat: number; lng: number } | null {
  if (!input) return null;

  // Case 1: Standard signed numbers e.g. "37.2715, 9.8738" or "37.2715 9.8738"
  const cleanStr = input.replace(/[°NSWE]/gi, ' ').trim();
  const parts = cleanStr.split(/[,;\s]+/).filter(Boolean);

  if (parts.length >= 2) {
    let lat = parseFloat(parts[0]);
    let lng = parseFloat(parts[1]);

    if (!isNaN(lat) && !isNaN(lng)) {
      if (input.toUpperCase().includes('S')) lat = -Math.abs(lat);
      if (input.toUpperCase().includes('W') || input.toUpperCase().includes('O')) lng = -Math.abs(lng);
      return { lat, lng };
    }
  }
  return null;
}

// Find closest known named location with Euclidean distance
export function getClosestOfflineLocation(lat: number, lng: number): string {
  let closestDist = Infinity;
  let closestName = '';

  for (const point of KNOWN_GEO_POINTS) {
    const dLat = lat - point.lat;
    const dLng = lng - point.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    if (dist < closestDist) {
      closestDist = dist;
      closestName = point.name;
    }
  }

  // If reasonably close (< 60km approx 0.55 deg)
  if (closestDist < 0.55 && closestName) {
    return closestName;
  }

  // Generic regional coordinate fallback
  const latCard = lat >= 0 ? 'Nord' : 'Sud';
  const lngCard = lng >= 0 ? 'Est' : 'Ouest';
  return `Point GPS (${Math.abs(lat).toFixed(2)}° ${latCard}, ${Math.abs(lng).toFixed(2)}° ${lngCard})`;
}

// Asynchronous Reverse Geocoding with OSM Nominatim API + Offline Cache
const reverseGeocodeCache = new Map<string, string>();

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return reverseGeocodeCache.get(cacheKey)!;
  }

  // Start with offline closest candidate immediately
  const offlineMatch = getClosestOfflineLocation(lat, lng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'fr, ar, en'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const place = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || addr.state;
        const country = addr.country || 'Tunisie';

        let formattedName = '';
        if (place) {
          formattedName = `${place}, ${country}`;
        } else if (data.display_name) {
          formattedName = data.display_name.split(',').slice(0, 2).join(', ').trim();
        }

        if (formattedName) {
          reverseGeocodeCache.set(cacheKey, formattedName);
          return formattedName;
        }
      }
    }
  } catch {
    // Network or timeout, fallback seamlessly to offline database
  }

  reverseGeocodeCache.set(cacheKey, offlineMatch);
  return offlineMatch;
}
