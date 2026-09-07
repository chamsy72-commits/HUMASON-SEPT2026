import React, { useState } from 'react';
import { SoundItem, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface ExpressBuyModalProps {
  sound: SoundItem | null;
  settings: UserSettings;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpressBuyModal: React.FC<ExpressBuyModalProps> = ({
  sound,
  settings,
  onClose,
  onSuccess
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const isLight = settings.theme === 'light';

  const [selectedLicense, setSelectedLicense] = useState<'standard' | 'commercial' | 'unlimited'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'edinar'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!sound) return null;

  // Calculate pricing based on selected license
  const basePriceTND = sound.priceTND;
  const licenseMultipliers = {
    standard: 1,
    commercial: 2.2,
    unlimited: 4.5
  };

  const currentPriceTND = Math.round(basePriceTND * licenseMultipliers[selectedLicense]);
  const currentPriceUSD = (currentPriceTND * 0.32).toFixed(2);
  const currentPriceEUR = (currentPriceTND * 0.30).toFixed(2);

  const displayPrice = () => {
    if (settings.currency === 'USD') return `$${currentPriceUSD} USD`;
    if (settings.currency === 'EUR') return `${currentPriceEUR} €`;
    return `${currentPriceTND} TND`;
  };

  // Step 3 Confirmation Trigger
  const handleConfirmPurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className={`relative max-w-lg w-full rounded-2xl border p-5 sm:p-7 shadow-2xl font-mono-tech transition-all overflow-hidden ${
        isLight
          ? 'bg-white border-slate-300 text-slate-900 shadow-slate-400/50'
          : 'bg-[#0c131d] border-[#00e5ff]/60 text-[#dce4e5] shadow-[0_0_35px_rgba(0,229,255,0.3)]'
      }`}>
        {/* Top glowing strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00e5ff] via-[#fd6c00] to-[#00e5ff]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-[#1a2635] pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-[#fd6c00]/10 text-[#fd6c00] flex items-center">
                <span className="material-symbols-outlined text-lg">bolt</span>
              </span>
              <h2 className={`text-lg font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Achat Express en 3 Clics
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#8b9a9d] mt-0.5">
              Acquisition instantanée de master audio • Étape 2/3
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {isDone ? (
          /* SUCCESS CELEBRATION VIEW */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-[#4edea3]/20 border-2 border-[#4edea3] rounded-full flex items-center justify-center mx-auto text-[#4edea3] animate-bounce">
              <span className="material-symbols-outlined text-3xl font-bold">download_done</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#4edea3] font-display">
                MASTER AUDIO DÉVERROUILLÉ !
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8b9a9d] mt-1">
                Le fichier WAV 24-bit/96kHz ({sound.title}) a été téléchargé et enregistré dans votre coffre client.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono-tech">
              Certificat de licence : <span className="font-bold">LIC-HUM-{sound.id.toUpperCase()}-2026</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* SOUND PREVIEW SUMMARY */}
            <div className={`p-3 rounded-xl border flex items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020912] border-[#1a2635]'
            }`}>
              <img
                src={sound.image}
                alt={sound.title}
                className="w-14 h-14 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {sound.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                    {sound.format}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#8b9a9d] truncate">
                  📍 {sound.location} • {sound.duration}
                </p>
                <p className="text-[10px] text-[#0099b8] dark:text-[#00e5ff] font-mono-tech">
                  Archive specimen {sound.specimenId || '#4092-A'}
                </p>
              </div>
            </div>

            {/* CLICK 2: SELECT LICENSE TYPE */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b9a9d] mb-2">
                1. Choisissez votre Type de Licence :
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Standard */}
                <button
                  type="button"
                  onClick={() => setSelectedLicense('standard')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedLicense === 'standard'
                      ? 'border-[#0099b8] dark:border-[#00e5ff] bg-[#0099b8]/10 dark:bg-[#00e5ff]/10 shadow-sm'
                      : isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1a2635] bg-[#020912]'
                  }`}
                >
                  <p className="text-xs font-bold">Créateur</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#8b9a9d]">Web, Podcast</p>
                  <p className="text-xs font-bold text-[#0099b8] dark:text-[#00e5ff] mt-1">
                    {formatCurrency(basePriceTND * 1, settings.currency)}
                  </p>
                </button>

                {/* Commercial */}
                <button
                  type="button"
                  onClick={() => setSelectedLicense('commercial')}
                  className={`p-2.5 rounded-xl border text-left transition-all relative ${
                    selectedLicense === 'commercial'
                      ? 'border-[#fd6c00] bg-[#fd6c00]/10 shadow-sm'
                      : isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1a2635] bg-[#020912]'
                  }`}
                >
                  <span className="absolute -top-2 right-1 text-[8px] px-1 py-0.2 rounded bg-[#fd6c00] text-white font-bold">
                    POPULAIRE
                  </span>
                  <p className="text-xs font-bold">Commercial</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#8b9a9d]">Pub & Cinéma</p>
                  <p className="text-xs font-bold text-[#fd6c00] mt-1">
                    {formatCurrency(basePriceTND * 2.2, settings.currency)}
                  </p>
                </button>

                {/* Unlimited */}
                <button
                  type="button"
                  onClick={() => setSelectedLicense('unlimited')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedLicense === 'unlimited'
                      ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                      : isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1a2635] bg-[#020912]'
                  }`}
                >
                  <p className="text-xs font-bold">Illimité</p>
                  <p className="text-[10px] text-slate-500 dark:text-[#8b9a9d]">Multi-siège</p>
                  <p className="text-xs font-bold text-purple-400 mt-1">
                    {formatCurrency(basePriceTND * 4.5, settings.currency)}
                  </p>
                </button>
              </div>
            </div>

            {/* PRE-CONFIGURED 1-CLICK PAYMENT METHOD */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#8b9a9d] mb-1.5">
                2. Moyen de Règlement Instantané :
              </label>

              <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020912] border-[#1a2635]'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0099b8]/20 text-[#0099b8] dark:text-[#00e5ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">credit_card</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold">Carte Archiviste •••• 4242</p>
                    <p className="text-[10px] text-slate-500 dark:text-[#8b9a9d]">Dr. E. Vance (Expire 12/28)</p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                  <span className="material-symbols-outlined text-xs">verified_user</span>
                  1-Click Ready
                </span>
              </div>
            </div>

            {/* CLICK 3: BIG CONFIRMATION & DIRECT DOWNLOAD BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPurchase}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fd6c00] to-[#ff8a33] hover:from-[#ff8a33] hover:to-[#fd6c00] text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement de la licence & Génération du Master...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">bolt</span>
                    Confirmer l'Achat & Télécharger le Master ({displayPrice()})
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-slate-500 dark:text-[#8b9a9d] mt-2">
                🔒 Cryptage 256-bit SSL • Facture avec TVA délivrée instantanément
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper format currency
function formatCurrency(amountTND: number, currency: string): string {
  const rounded = Math.round(amountTND);
  if (currency === 'USD') return `$${Math.round(rounded * 0.32)} USD`;
  if (currency === 'EUR') return `${Math.round(rounded * 0.30)} €`;
  return `${rounded} TND`;
}
