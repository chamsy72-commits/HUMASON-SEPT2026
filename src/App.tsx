import React, { useState, useEffect } from 'react';
import { AppTab, CartItem, EnterpriseTier, SoundItem, UserSettings } from './types';
import { INITIAL_SOUNDS } from './data/mockData';
import { loadAllSoundsFromDatabase, saveSoundToDatabase, deleteSoundFromDatabase } from './services/soundDatabase';
import { SideNavBar } from './components/SideNavBar';
import { TopHeader } from './components/TopHeader';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { SoundLibraryView } from './components/SoundLibraryView';
import { ExplorerView } from './components/ExplorerView';
import { PacksView } from './components/PacksView';
import { ProView } from './components/ProView';
import { ContributorsView } from './components/ContributorsView';
import { SettingsView } from './components/SettingsView';
import { CheckoutModal } from './components/CheckoutModal';
import { ExpressBuyModal } from './components/ExpressBuyModal';
import { CartModal } from './components/CartModal';
import { AddSoundModal } from './components/AddSoundModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { PlatformInfoModal } from './components/PlatformInfoModal';
import { AdminView } from './components/AdminView';

const loadInitialSounds = (): SoundItem[] => {
  try {
    const deletedIds = new Set<string>(JSON.parse(localStorage.getItem('humason_deleted_sound_ids') || '[]'));
    const savedModified = localStorage.getItem('humason_modified_sounds');
    if (savedModified) {
      const parsedModified: SoundItem[] = JSON.parse(savedModified);
      if (Array.isArray(parsedModified) && parsedModified.length > 0) {
        return parsedModified.filter(s => !deletedIds.has(s.id));
      }
    }

    const saved = localStorage.getItem('humason_deposited_sounds');
    let combined = [...INITIAL_SOUNDS];
    if (saved) {
      const parsed: SoundItem[] = JSON.parse(saved);
      const initIds = new Set(INITIAL_SOUNDS.map(s => s.id));
      const customOnly = parsed.filter(s => !initIds.has(s.id));
      combined = [...customOnly, ...INITIAL_SOUNDS];
    }
    return combined.filter(s => !deletedIds.has(s.id));
  } catch (e) {
    console.warn('Could not load custom sounds from localStorage', e);
  }
  return INITIAL_SOUNDS;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('library');
  const [sounds, setSounds] = useState<SoundItem[]>(loadInitialSounds);
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(() => {
    const initialList = loadInitialSounds();
    return initialList[0] || INITIAL_SOUNDS[0];
  });

  // Rehydrate sounds from IndexedDB (with any stored binary audio/image blobs)
  useEffect(() => {
    let isMounted = true;
    loadAllSoundsFromDatabase().then((dbSounds) => {
      if (isMounted && dbSounds && dbSounds.length > 0) {
        setSounds(dbSounds);
        setSelectedSound(prev => {
          if (!prev) return dbSounds[0];
          const found = dbSounds.find(s => s.id === prev.id);
          return found || dbSounds[0];
        });
      }
    }).catch(err => {
      console.warn('Could not load sounds from IndexedDB:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartToast, setCartToast] = useState<{ message: string; visible: boolean } | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutSingleItem, setCheckoutSingleItem] = useState<CartItem | null>(null);
  const [expressBuySound, setExpressBuySound] = useState<SoundItem | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isPlatformInfoOpen, setIsPlatformInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [settings, setSettings] = useState<UserSettings>({
    language: 'FR',
    currency: 'EUR',
    theme: 'dark',
    dateFormat: 'DD/MM/YYYY',
    unitSystem: 'Metric',
    highResStreaming: true,
    autoPlay: true,
    spatialAudio: true,
    twoFactorAuth: false,
    publicAnalytics: true
  });

  const handleUpdateSettings = (newSet: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSet }));
  };

  const handleAddToCart = (
    item: { id: string; title: string; subtitle: string; priceUSD: number; type: 'pack' | 'sound' | 'plan' },
    openDrawer: boolean = false
  ) => {
    const newItem: CartItem = {
      id: `${item.id}-${Date.now()}`,
      title: item.title,
      subtitle: item.subtitle,
      priceUSD: item.priceUSD,
      type: item.type
    };
    setCart(prev => [...prev, newItem]);
    
    if (openDrawer) {
      setIsCartOpen(true);
    } else {
      setCartToast({
        message: `« ${item.title} » a été ajouté à votre panier d'archives.`,
        visible: true
      });
      setTimeout(() => {
        setCartToast(prev => (prev ? { ...prev, visible: false } : null));
      }, 4000);
    }
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const handleDeleteSound = (soundId: string) => {
    // Delete from IndexedDB store (blobs & metadata)
    deleteSoundFromDatabase(soundId).catch(err => {
      console.warn('Could not delete sound from IndexedDB:', err);
    });

    setSounds(prev => {
      const updated = prev.filter(s => s.id !== soundId);
      try {
        const existingDeleted: string[] = JSON.parse(localStorage.getItem('humason_deleted_sound_ids') || '[]');
        if (!existingDeleted.includes(soundId)) {
          localStorage.setItem('humason_deleted_sound_ids', JSON.stringify([...existingDeleted, soundId]));
        }
        const customSaved = localStorage.getItem('humason_deposited_sounds');
        if (customSaved) {
          const parsed: SoundItem[] = JSON.parse(customSaved);
          const filteredCustom = parsed.filter(s => s.id !== soundId);
          localStorage.setItem('humason_deposited_sounds', JSON.stringify(filteredCustom));
        }
      } catch (e) {
        console.warn('Could not update localStorage on delete', e);
      }
      return updated;
    });

    if (selectedSound?.id === soundId) {
      setSelectedSound(prev => {
        const remaining = sounds.filter(s => s.id !== soundId);
        return remaining.length > 0 ? remaining[0] : null;
      });
    }
  };

  const handleOpenDepositModal = () => {
    setIsDepositModalOpen(true);
  };

  const handleOpenCheckoutForTier = (tier: EnterpriseTier) => {
    const price = typeof tier.priceUSD === 'number' ? tier.priceUSD : 1250;
    setCheckoutSingleItem({
      id: tier.id,
      title: `${tier.title} License`,
      subtitle: `${tier.period} commercial clearance`,
      priceUSD: price,
      type: 'plan'
    });
    setIsCheckoutOpen(true);
  };

  const handleAddSound = (newSound: SoundItem, audioBlob?: Blob, imageBlob?: Blob) => {
    // Optimistic state update
    setSounds(prev => [newSound, ...prev.filter(s => s.id !== newSound.id)]);
    setSelectedSound(newSound);

    // Persist audio blob, image blob and metadata to IndexedDB
    saveSoundToDatabase(newSound, audioBlob, imageBlob)
      .then(saved => {
        setSounds(prev => prev.map(s => (s.id === saved.id ? saved : s)));
        if (selectedSound?.id === saved.id) setSelectedSound(saved);
      })
      .catch(err => {
        console.warn('Could not save sound to IndexedDB:', err);
      });

    // Also update localStorage cache for non-blob metadata
    try {
      const initIds = new Set(INITIAL_SOUNDS.map(s => s.id));
      const customOnly = [newSound, ...sounds].filter(s => !initIds.has(s.id));
      localStorage.setItem('humason_deposited_sounds', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Could not save to localStorage fallback', e);
    }
  };

  const handleUpdateSound = (updatedSound: SoundItem, audioBlob?: Blob, imageBlob?: Blob) => {
    // Optimistic update
    setSounds(prev => prev.map(s => (s.id === updatedSound.id ? updatedSound : s)));
    if (selectedSound?.id === updatedSound.id) {
      setSelectedSound(updatedSound);
    }

    // Persist to IndexedDB
    saveSoundToDatabase(updatedSound, audioBlob, imageBlob)
      .then(saved => {
        setSounds(prev => prev.map(s => (s.id === saved.id ? saved : s)));
        if (selectedSound?.id === saved.id) setSelectedSound(saved);
      })
      .catch(err => {
        console.warn('Could not update sound in IndexedDB:', err);
      });

    // Update localStorage fallback
    try {
      const initIds = new Set(INITIAL_SOUNDS.map(s => s.id));
      const customOnly = sounds.map(s => (s.id === updatedSound.id ? updatedSound : s)).filter(s => !initIds.has(s.id));
      localStorage.setItem('humason_deposited_sounds', JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Could not save updated sound to localStorage fallback', e);
    }
  };

  // Filter sounds according to search query
  const filteredSounds = sounds.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.format.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isLight = settings.theme === 'light';

  return (
    <div className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-200 ${settings.theme} ${isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0B0E14] text-[#F8FAFC]'}`}>
      {/* Side Navigation Rail */}
      <SideNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
        settings={settings}
        onOpenPlatformInfo={() => setIsPlatformInfoOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
      />

      {/* Top Header Bar */}
      <TopHeader
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenClientArea={() => setActiveTab('pro')}
        onOpenPlatformInfo={() => setIsPlatformInfoOpen(true)}
        isAdminAuthenticated={isAdminAuthenticated}
        onOpenAdmin={() => {
          if (isAdminAuthenticated) {
            setActiveTab('admin');
          } else {
            setIsAdminLoginOpen(true);
          }
        }}
      />

      {/* Main View Router */}
      <main className="w-full">
        {activeTab === 'library' && (
          <SoundLibraryView
            sounds={filteredSounds}
            selectedSound={selectedSound}
            onSelectSound={setSelectedSound}
            onAddToCart={handleAddToCart}
            onOpenExpressBuy={(sound) => setExpressBuySound(sound)}
            onNavigateToAtlas={(sound) => {
              if (sound) setSelectedSound(sound);
              setActiveTab('explorer');
            }}
            onOpenDepositModal={handleOpenDepositModal}
            settings={settings}
            isAdminAuthenticated={isAdminAuthenticated}
            onDeleteSound={handleDeleteSound}
            onUpdateSound={handleUpdateSound}
            onNavigateToAdmin={(sound) => {
              if (sound) setSelectedSound(sound);
              setActiveTab('admin');
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerView
            sounds={filteredSounds}
            selectedSound={selectedSound}
            onSelectSound={setSelectedSound}
            onAddToCart={handleAddToCart}
            onOpenDepositModal={handleOpenDepositModal}
            onNavigateToMarketplace={() => setActiveTab('library')}
            settings={settings}
            isAdminAuthenticated={isAdminAuthenticated}
            onDeleteSound={handleDeleteSound}
            onUpdateSound={handleUpdateSound}
          />
        )}

        {activeTab === 'packs' && (
          <PacksView
            settings={settings}
            onAddToCart={handleAddToCart}
            onOpenCheckoutForTier={handleOpenCheckoutForTier}
          />
        )}

        {activeTab === 'pro' && (
          <ProView
            settings={settings}
            onOpenUpgradeModal={() => {
              setCheckoutSingleItem({
                id: 'pro-archivist-annual',
                title: 'Institutional Vault Plan',
                subtitle: 'Annual facility access & perpetual license',
                priceUSD: 1250,
                type: 'plan'
              });
              setIsCheckoutOpen(true);
            }}
            sounds={sounds}
            onAddSound={handleAddSound}
            onUpdateSound={handleUpdateSound}
            onDeleteSound={handleDeleteSound}
            onNavigateToAtlas={(sound) => {
              if (sound) setSelectedSound(sound);
              setActiveTab('explorer');
            }}
            isAdminAuthenticated={isAdminAuthenticated}
            onAdminAuthenticated={() => setIsAdminAuthenticated(true)}
          />
        )}

        {activeTab === 'contributors' && (
          <ContributorsView
            settings={settings}
            onOpenDepositModal={handleOpenDepositModal}
            initialMode="contributors"
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            sounds={sounds}
            onAddSound={handleAddSound}
            onUpdateSound={handleUpdateSound}
            onDeleteSound={handleDeleteSound}
            settings={settings}
            onNavigateToAtlas={(sound) => {
              if (sound) setSelectedSound(sound);
              setActiveTab('explorer');
            }}
          />
        )}

        {activeTab === 'anthropology' && (
          <ContributorsView
            settings={settings}
            onOpenDepositModal={handleOpenDepositModal}
            initialMode="anthropology"
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Global Bottom Audio Player Bar */}
      <GlobalAudioPlayer
        currentSound={selectedSound}
        settings={settings}
        onOpenCheckout={() => {
          if (selectedSound) {
            setExpressBuySound(selectedSound);
          }
        }}
      />

      {/* Express 3-Click Buy Modal */}
      {expressBuySound && (
        <ExpressBuyModal
          sound={expressBuySound}
          settings={settings}
          onClose={() => setExpressBuySound(null)}
          onSuccess={() => {
            setExpressBuySound(null);
            setActiveTab('pro');
          }}
        />
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <CartModal
          items={cart}
          settings={settings}
          onRemoveItem={handleRemoveFromCart}
          onClearCart={() => setCart([])}
          onClose={() => setIsCartOpen(false)}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setCheckoutSingleItem(null);
            setIsCheckoutOpen(true);
          }}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          item={checkoutSingleItem}
          items={checkoutSingleItem ? [] : cart}
          settings={settings}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutSingleItem(null);
          }}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            setCheckoutSingleItem(null);
            setCart([]);
            setActiveTab('pro');
          }}
        />
      )}

      {/* Add Sound / Deposit Artifact Modal */}
      {isDepositModalOpen && (
        <AddSoundModal
          settings={settings}
          onClose={() => setIsDepositModalOpen(false)}
          onAddSound={handleAddSound}
        />
      )}

      {/* Admin Authentication Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          settings={settings}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={() => {
            setIsAdminAuthenticated(true);
            setIsAdminLoginOpen(false);
            setActiveTab('admin');
          }}
        />
      )}

      {/* Platform Info Modal (HUMASON Builders & Arabic Description) */}
      {isPlatformInfoOpen && (
        <PlatformInfoModal
          settings={settings}
          onClose={() => setIsPlatformInfoOpen(false)}
        />
      )}

      {/* Floating Non-Blocking Cart Toast */}
      {cartToast && cartToast.visible && (
        <div className="fixed bottom-24 right-6 z-50 animate-bounce-in">
          <div className="border border-[#00A6D6]/40 bg-[#131822]/95 backdrop-blur-md rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(0,166,214,0.25)] flex items-center gap-3.5 max-w-md">
            <div className="w-9 h-9 rounded-xl bg-[#00A6D6]/15 text-[#00A6D6] border border-[#00A6D6]/40 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">check_circle</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{cartToast.message}</p>
              <p className="text-[10px] text-[#94A3B8]">Vous pouvez continuer à explorer d'autres sons.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setCartToast(null);
                  setIsCartOpen(true);
                }}
                className="px-2.5 py-1.5 bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-mono-tech text-[11px] font-bold rounded-xl transition-all shadow-[0_0_10px_rgba(0,166,214,0.3)]"
              >
                Panier ({cart.length})
              </button>
              <button
                onClick={() => setCartToast(null)}
                className="p-1 text-[#94A3B8] hover:text-white rounded-md transition-colors"
                title="Fermer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
