import { SoundItem, ThematicPack, EnterpriseTier, UserProfile, Transaction } from '../types';

export const INITIAL_SOUNDS: SoundItem[] = [
  {
    id: 'tunis-medina-01',
    title: 'Medina Morning Call',
    location: 'Tunis, Tunisia',
    coords: '36.8065° N, 10.1815° E',
    lat: 36.8065,
    lng: 10.1815,
    format: '3D Spatial',
    duration: '04:22',
    priceTND: 15.0,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop',
    description: 'An atmospheric morning call echoing through the ancient stone alleyways of the Tunis Medina. Recorded with ambisonic 3D spatial microphones.',
    soundType: 'medina',
    specimenId: '#4092-A',
    organology: {
      classification: 'Acoustic Environment / Call',
      modalTaxonomy: 'M7ayer 3RA9',
      geospatialOrigin: 'North Africa (Tunis)',
      acousticTrait: '3D Spatial Resonance'
    }
  },
  {
    id: 'sousse-coastal-05',
    title: 'Sousse Ribat & Sea Breeze',
    location: 'Sousse, Tunisia',
    coords: '35.8256° N, 10.6369° E',
    lat: 35.8256,
    lng: 10.6369,
    format: '3D Spatial',
    duration: '05:40',
    priceTND: 18.5,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    description: 'Mediterranean tide rhythm and acoustic wind whistles captured at the medieval Ribat tower in Sousse harbor.',
    soundType: 'coastal',
    specimenId: '#5512-S',
    organology: {
      classification: 'Hydro-Acoustic Wave & Wind',
      modalTaxonomy: 'Coastal Field Master',
      geospatialOrigin: 'Tunisia (Sousse)',
      acousticTrait: 'Ocean Tide Spatial Drone'
    }
  },
  {
    id: 'algiers-casbah-02',
    title: 'Casbah Mandole Improvisation',
    location: 'Algiers, Algeria',
    coords: '36.7853° N, 3.0600° E',
    lat: 36.7853,
    lng: 3.06,
    format: 'Stereo',
    duration: '06:14',
    priceTND: 22.5,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    description: 'Uncompressed 24-bit/96kHz solo mandole recording capturing traditional Chaabi scales in an authentic courtyard in Algiers.',
    soundType: 'oud',
    specimenId: '#3102-B',
    organology: {
      classification: 'Plucked Chordophone',
      modalTaxonomy: 'Sika / Chaabi',
      geospatialOrigin: 'North Africa (Algiers)',
      acousticTrait: 'Steel String Resonance'
    }
  },
  {
    id: 'casablanca-gnawa-03',
    title: 'Gnawa Guembri & Krakebs Ritual',
    location: 'Casablanca, Morocco',
    coords: '33.5731° N, 7.5898° W',
    lat: 33.5731,
    lng: -7.5898,
    format: 'Ambisonic',
    duration: '08:45',
    priceTND: 35.0,
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1200&auto=format&fit=crop',
    description: 'Trance rhythm session played on gut-string bass guembri with iron castanets (krakebs). Captured live during a Lila ceremony.',
    soundType: 'bendir',
    specimenId: '#8821-G',
    organology: {
      classification: 'Bass Plucked Lute & Idiophone',
      modalTaxonomy: 'Tagnaweit',
      geospatialOrigin: 'Morocco (Essaouira/Casablanca)',
      acousticTrait: 'Low Resonance & Iron Clatter'
    }
  },
  {
    id: 'tripoli-dunes-04',
    title: 'Sahara Dune Wind Ambience',
    location: 'Tripoli / Fezzan, Libya',
    coords: '32.8872° N, 13.1913° E',
    lat: 32.8872,
    lng: 13.1913,
    format: '3D Spatial',
    duration: '12:00',
    priceTND: 18.0,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
    description: 'Singing sands and desert winds swept across the erg dunes in southern Fezzan. Captured with 3D ambisonic arrays.',
    soundType: 'desert',
    specimenId: '#1094-W',
    organology: {
      classification: 'Aolian Acoustic Wave',
      modalTaxonomy: 'Nature Field Master',
      geospatialOrigin: 'Sahara Desert (Libya)',
      acousticTrait: 'Harmonic Singing Sand Drone'
    }
  },
  {
    id: 'djerba-palms-06',
    title: 'Djerba Island Palms & Birds',
    location: 'Djerba, Tunisia',
    coords: '33.8076° N, 10.8451° E',
    lat: 33.8076,
    lng: 10.8451,
    format: 'Stereo',
    duration: '07:10',
    priceTND: 16.0,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop',
    description: 'Morning bird choruses echoing through ancient olive groves and palm orchards on the Mediterranean island of Djerba.',
    soundType: 'coastal',
    specimenId: '#6619-D',
    organology: {
      classification: 'Avian Biophony',
      modalTaxonomy: 'Island Bio-Acoustics',
      geospatialOrigin: 'Tunisia (Djerba)',
      acousticTrait: 'Natural Surround Field'
    }
  },
  {
    id: 'marrakech-bazaar-07',
    title: 'Jemaa el-Fna Acoustic Echoes',
    location: 'Marrakech, Morocco',
    coords: '31.6295° N, 7.9811° W',
    lat: 31.6295,
    lng: -7.9811,
    format: 'Ambisonic',
    duration: '09:30',
    priceTND: 28.0,
    image: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?q=80&w=1200&auto=format&fit=crop',
    description: 'Polyphonic marketplace ambience featuring storytellers, Bendir frame drums, and bustling dusk echoes.',
    soundType: 'bendir',
    specimenId: '#9930-M',
    organology: {
      classification: 'Polysonic Cultural Market',
      modalTaxonomy: 'Berber Folk Polyphony',
      geospatialOrigin: 'Morocco (Marrakech)',
      acousticTrait: 'Ambisonic Density'
    }
  },
  {
    id: 'matmata-troglodyte-08',
    title: 'Matmata Troglodyte Reverberation',
    location: 'Matmata, Tunisia',
    coords: '33.5422° N, 9.9678° E',
    lat: 33.5422,
    lng: 9.9678,
    format: '3D Spatial',
    duration: '06:45',
    priceTND: 24.0,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200&auto=format&fit=crop',
    description: 'Underground chamber impulse responses, stone clay natural reverb, and ceremonial Nay wind instrument echoes.',
    soundType: 'desert',
    specimenId: '#7730-T',
    organology: {
      classification: 'Underground Acoustic Chamber',
      modalTaxonomy: 'Berber Architecture Echo',
      geospatialOrigin: 'Tunisia (Matmata)',
      acousticTrait: 'Deep Earth Reverb & Impulse'
    }
  },
  {
    id: 'sidi-bousaid-cafe-09',
    title: 'Café des Nattes Acoustic Evening',
    location: 'Sidi Bou Said, Tunisia',
    coords: '36.8703° N, 10.3417° E',
    lat: 36.8703,
    lng: 10.3417,
    format: 'Stereo',
    duration: '05:12',
    priceTND: 19.0,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=1200&auto=format&fit=crop',
    description: 'Mint tea glasses clinking, jasmine flower peddlers, distant Oud strums, and Mediterranean evening breeze.',
    soundType: 'oud',
    specimenId: '#3320-S',
    organology: {
      classification: 'Social Hydrophone & Chordophone',
      modalTaxonomy: 'Malouf / Andalusian',
      geospatialOrigin: 'Tunisia (Sidi Bou Said)',
      acousticTrait: 'Terrace Ambient Stereo'
    }
  },
  {
    id: 'chebika-oasis-10',
    title: 'Chebika Mountain Canyon Waterfall',
    location: 'Tozeur / Chebika, Tunisia',
    coords: '34.3194° N, 7.9333° E',
    lat: 34.3194,
    lng: 7.9333,
    format: 'Ambisonic',
    duration: '08:20',
    priceTND: 32.0,
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
    description: 'Fresh natural canyon spring rushing through geological fault rocks amidst deep Sahara desert heat.',
    soundType: 'coastal',
    specimenId: '#1204-C',
    organology: {
      classification: 'Hydro-Geological Cascade',
      modalTaxonomy: 'Mountain Spring Bio-Resonance',
      geospatialOrigin: 'Tunisia (Chebika)',
      acousticTrait: 'Full Ambisonic Water Rush'
    }
  }
];

export const INITIAL_PACKS: ThematicPack[] = [
  {
    id: 'pack-oud-solo',
    title: 'Oud Solo Masterworks',
    badge: 'Verified',
    badgeType: 'verified',
    description: 'Traditional improvisations & microtonal modal scales recorded in high acoustic fidelity.',
    spec: '24-bit/96kHz',
    priceUSD: 45,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    tracksCount: 14
  },
  {
    id: 'pack-tunisian-beaches',
    title: 'Tunisian Beaches & Coasts',
    badge: 'Atmos',
    badgeType: 'atmos',
    description: 'Coastal winds, Mediterranean tide loops and distant surf from Sousse to Djerba.',
    spec: '24-bit/96kHz',
    priceUSD: 30,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    tracksCount: 22
  },
  {
    id: 'pack-desert-3d',
    title: 'Sahara Desert 3D Spatial',
    badge: 'Spatial',
    badgeType: 'spatial',
    description: 'Ambisonic captures of the deep Sahara desert night & day acoustic resonance.',
    spec: '32-bit/192kHz',
    priceUSD: 85,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200&auto=format&fit=crop',
    tracksCount: 18
  },
  {
    id: 'pack-medina-atmos',
    title: 'Medina Atmos & Heritage',
    badge: 'Atmos',
    badgeType: 'atmos',
    description: 'Crowds, calls, artisan copper hammers, and historic urban stone echoes.',
    spec: '24-bit/96kHz',
    priceUSD: 55,
    image: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop',
    tracksCount: 30
  }
];

export const ENTERPRISE_TIERS: EnterpriseTier[] = [
  {
    id: 'standard-media',
    title: 'Standard Media',
    priceUSD: 499,
    period: '/project',
    features: [
      'Commercial clearance up to 1M impressions',
      '24-bit/48kHz standard resolution',
      'Non-exclusive sync license'
    ],
    recommended: false
  },
  {
    id: 'broadcast-film',
    title: 'Broadcast & Film',
    priceUSD: 1250,
    period: '/project',
    features: [
      'Unlimited global theatrical & broadcast',
      'Up to 32-bit/192kHz archival masters',
      'Access to spatial/ambisonic B-format',
      'Stem separation where available'
    ],
    recommended: true
  },
  {
    id: 'institution-vault',
    title: 'Institution/Vault',
    priceUSD: 'Custom',
    period: '/year',
    features: [
      'Perpetual multi-seat facility license',
      'Raw ethnographic field notes & metadata',
      'Direct curation support from archivists'
    ],
    recommended: false
  }
];

export const MOCK_USER: UserProfile = {
  name: 'Dr. E. Vance',
  id: 'HUM-7734-X',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhiK9SmZM09X-xc1ydU__XbioQA-z5t-3MqLN1g60sZhkgpkaimhSNcEhghykojlADApe_qERPlsV3ATcblDaf7Xh2lesp0sef4rSaV3F3umZxF1F_9V0fJq7K_AcmbQVl3Y_uLAYGIusnFoR-TA_5GLw3V4oW98VYn73sLae7ROvlb7hiu9SVp5yWk6vFEufi_ANKBIi9VRlSF1C2Dqhmos9WtLETqbooB2pC5PCqxJ3XlvuNR2mjBQ',
  role: 'Sonic Archivist',
  vaultUsedGB: 390,
  vaultMaxGB: 500,
  planName: 'Pro Archivist',
  planPriceUSD: 49,
  nextRenewal: 'Oct 12, 2026',
  paymentCardLast4: '4242'
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    invCode: 'INV-8832',
    title: 'Pro Archivist Monthly',
    date: 'Sep 12, 2026',
    amountUSD: 49.0,
    status: 'PAID',
    type: 'subscription'
  },
  {
    id: 'tx-2',
    invCode: 'INV-8790',
    title: 'Thematic Pack: Medina Atmos',
    date: 'Aug 28, 2026',
    amountUSD: 15.0,
    status: 'PAID',
    type: 'pack'
  },
  {
    id: 'tx-3',
    invCode: 'INV-8745',
    title: 'Pro Archivist Monthly',
    date: 'Aug 12, 2026',
    amountUSD: 49.0,
    status: 'PAID',
    type: 'subscription'
  },
  {
    id: 'tx-4',
    invCode: 'INV-8612',
    title: 'Pro Archivist Monthly',
    date: 'Jul 12, 2026',
    amountUSD: 49.0,
    status: 'PAID',
    type: 'subscription'
  }
];

export const TRANSLATIONS = {
  FR: {
    library: 'Bibliothèque',
    explorer: 'Atlas Scientifique',
    packs: 'Packs & Bundles',
    pro: 'Espace Pro',
    contributors: 'Contributeurs',
    anthropology: 'Anthropologie',
    settings: 'Paramètres',
    clientArea: 'Espace Client',
    tagline: "Première marketplace sonore d'Afrique",
    searchPlaceholder: 'Rechercher un son, un lieu, un instrument...',
    buyIn3Clicks: 'Acheter en 3 clics',
    instantLicense: 'Licence Instantanée',
    addToCart: 'Ajouter au Panier',
    downloadSample: 'Écouter l extrait',
    addSound: 'Déposer un Son',
    selectSound: 'Sélectionner un son',
    noActiveSession: 'Aucune session active',
    confirmPayment: 'Confirmer le paiement',
    secureCheckout: 'Paiement Sécurisé',
    depositArtifact: 'Déposer un Artefact',
    interfaceLanguage: 'Langue de l interface',
    regionalFormatting: 'Formatage Régional',
    confirmChanges: 'Confirmer les modifications',
    close: 'Fermer',
    systemPreferences: 'Préférences Système',
    accountStatus: 'Statut du Compte',
    vaultStorage: 'Stockage du Coffre'
  },
  EN: {
    library: 'Sound Library',
    explorer: 'Scientific Atlas',
    packs: 'Packs & Bundles',
    pro: 'Pro Vault',
    contributors: 'Contributors',
    anthropology: 'Anthropology',
    settings: 'Settings',
    clientArea: 'Client Area',
    tagline: 'First African Sonic Marketplace',
    searchPlaceholder: 'Search sounds, locations, instruments...',
    buyIn3Clicks: 'Buy in 3 Clicks',
    instantLicense: 'Instant License',
    addToCart: 'Add to Cart',
    downloadSample: 'Preview Sample',
    addSound: 'Deposit Sound',
    selectSound: 'Select a sound',
    noActiveSession: 'No Active Session',
    confirmPayment: 'Confirm Payment',
    secureCheckout: 'Secure Checkout',
    depositArtifact: 'Deposit Artifact',
    interfaceLanguage: 'Interface Language',
    regionalFormatting: 'Regional Formatting',
    confirmChanges: 'Confirm Changes',
    close: 'Close',
    systemPreferences: 'System Preferences',
    accountStatus: 'Account Status',
    vaultStorage: 'Vault Storage'
  },
  AR: {
    library: 'المكتبة الصوتية',
    explorer: 'الأطلس العلمي',
    packs: 'الحزم والباقات',
    pro: 'الاشتراك الاحترافي',
    contributors: 'المساهمون',
    anthropology: 'علم الإنسان',
    settings: 'الإعدادات',
    clientArea: 'منطقة العملاء',
    tagline: 'أول سوق صوتي في أفريقيا',
    searchPlaceholder: 'بحث في الأصوات والآلات والمواقع...',
    buyIn3Clicks: 'شراء بثلاث نقرات',
    instantLicense: 'ترخيص فوري',
    addToCart: 'أضف إلى السلة',
    downloadSample: 'معاينة الصوت',
    addSound: 'إضافة صوت',
    selectSound: 'اختر صوتاً',
    noActiveSession: 'لا توجد جلسة نشطة',
    confirmPayment: 'تأكيد الدفع',
    secureCheckout: 'الدفع الآمن',
    depositArtifact: 'إيداع أثر صوتي',
    interfaceLanguage: 'لغة الواجهة',
    regionalFormatting: 'التنسيق الإقليمي',
    confirmChanges: 'تأكيد التغييرات',
    close: 'إغلاق',
    systemPreferences: 'تفضيلات النظام',
    accountStatus: 'حالة الحساب',
    vaultStorage: 'سعة الخزنة'
  }
};
