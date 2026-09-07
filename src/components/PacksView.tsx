import React from 'react';
import { EnterpriseTier, ThematicPack, UserSettings } from '../types';
import { ENTERPRISE_TIERS, INITIAL_PACKS } from '../data/mockData';
import { togglePlayState } from '../services/audioSynth';

interface PacksViewProps {
  settings: UserSettings;
  onAddToCart: (item: { id: string; title: string; subtitle: string; priceUSD: number; type: 'pack' | 'plan' }) => void;
  onOpenCheckoutForTier: (tier: EnterpriseTier) => void;
}

export const PacksView: React.FC<PacksViewProps> = ({
  settings,
  onAddToCart,
  onOpenCheckoutForTier
}) => {
  const formatCurrency = (valUSD: number) => {
    if (settings.currency === 'EUR') return `€${Math.round(valUSD * 0.92)}`;
    if (settings.currency === 'TND') return `${Math.round(valUSD * 3.1)} TND`;
    return `$${valUSD}`;
  };

  const handlePreviewPack = (pack: ThematicPack) => {
    const soundType = pack.id.includes('oud') ? 'oud' : pack.id.includes('desert') ? 'desert' : 'medina';
    togglePlayState(soundType, 0.8);
  };

  const isLight = settings.theme === 'light';

  return (
    <div className={`w-full min-h-[calc(100vh-5rem)] p-3 sm:p-6 md:p-12 pb-32 ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] transition-colors max-w-full overflow-hidden ${
      isLight ? 'bg-[#f1f5f9] text-slate-800' : 'bg-[#020912] text-[#dce4e5]'
    }`}>
      {/* Section 1: Thematic Packs */}
      <section className="mb-16">
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b pb-4 ${
          isLight ? 'border-slate-200' : 'border-[#1a2635]'
        }`}>
          <div>
            <span className="font-mono-tech text-xs text-[#0099b8] dark:text-[#00e5ff] uppercase tracking-widest">
              CURATED COLLECTION
            </span>
            <h2 className={`text-2xl md:text-3xl font-extrabold font-display mt-1 ${isLight ? 'text-slate-900' : 'text-[#dce4e5]'}`}>
              Thematic Audio Packs
            </h2>
          </div>
          <p className={`font-mono-tech text-xs max-w-md mt-2 md:mt-0 ${isLight ? 'text-slate-600' : 'text-[#6b7a7d]'}`}>
            Uncompressed multi-stem ethnographic field packs with full commercial clearance for producers and archivists.
          </p>
        </div>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`border transition-all rounded-xl overflow-hidden flex flex-col group shadow-md ${
                isLight 
                  ? 'bg-white border-slate-200 hover:border-[#0099b8] hover:shadow-lg' 
                  : 'bg-[#0c131d] border-[#1a2635] hover:border-[#00e5ff] hover:shadow-[0_0_20px_rgba(0,229,255,0.2)]'
              }`}
            >
              {/* Cover Image */}
              <div className="relative h-44 overflow-hidden bg-slate-200">
                <img
                  src={pack.image}
                  alt={pack.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className={`absolute top-3 left-3 font-mono-tech text-[10px] font-bold px-2 py-0.5 rounded text-[#020912] uppercase ${
                  pack.badgeType === 'verified' ? 'bg-[#4edea3]' : pack.badgeType === 'atmos' ? 'bg-[#00e5ff]' : 'bg-[#fd6c00]'
                }`}>
                  {pack.badge}
                </span>
                <span className="absolute bottom-3 right-3 bg-black/80 font-mono-tech text-[10px] text-[#00e5ff] px-2 py-0.5 border border-white/20 rounded">
                  {pack.tracksCount} TRACKS
                </span>
              </div>

              {/* Pack Body */}
              <div className="p-5 flex-1 flex flex-col justify-between font-mono-tech">
                <div>
                  <h3 className={`font-bold text-base font-display mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{pack.title}</h3>
                  <p className={`text-xs font-sans leading-snug mb-3 ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                    {pack.description}
                  </p>
                  <div className={`text-[11px] mb-4 ${isLight ? 'text-slate-500' : 'text-[#6b7a7d]'}`}>
                    SPEC: <span className="text-[#0099b8] dark:text-[#00e5ff] font-bold">{pack.spec}</span>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className={`flex justify-between items-center border-t pt-3 mt-2 ${isLight ? 'border-slate-200' : 'border-[#1a2635]'}`}>
                  <span className="font-bold text-sm text-[#0099b8] dark:text-[#00e5ff]">
                    {formatCurrency(pack.priceUSD)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePreviewPack(pack)}
                      className={`p-1.5 rounded transition-colors ${
                        isLight ? 'bg-slate-100 text-[#0099b8] hover:bg-[#0099b8] hover:text-white' : 'bg-[#1a2635] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-[#020912]'
                      }`}
                      title="Preview Track"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                    </button>
                    <button
                      onClick={() => onAddToCart({
                        id: pack.id,
                        title: pack.title,
                        subtitle: `${pack.tracksCount} tracks • ${pack.spec}`,
                        priceUSD: pack.priceUSD,
                        type: 'pack'
                      })}
                      className="bg-[#fd6c00] hover:bg-[#ff8a33] text-white font-bold text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">shopping_bag</span>
                      BUY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Enterprise Licensing */}
      <section>
        <div className="mb-8 border-b border-[#1a2635] pb-4">
          <span className="font-mono-tech text-xs text-[#00e5ff] uppercase tracking-widest">
            COMMERCIAL & INSTITUTIONAL
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#dce4e5] font-display mt-1">
            Enterprise Licensing
          </h2>
        </div>

        {/* Licensing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ENTERPRISE_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`bg-[#0c131d] border p-8 rounded flex flex-col justify-between font-mono-tech relative ${
                tier.recommended
                  ? 'border-[#00e5ff] shadow-[0_0_24px_rgba(0,229,255,0.2)] bg-gradient-to-b from-[#0c131d] to-[#041624]'
                  : 'border-[#1a2635]'
              }`}
            >
              {tier.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00e5ff] text-[#001f24] font-bold text-[10px] px-3 py-0.5 uppercase tracking-wider rounded">
                  RECOMMENDED FOR FILM
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-[#ffffff] font-display mb-2">{tier.title}</h3>
                <div className="flex items-baseline space-x-1 mb-6">
                  <span className="text-3xl font-extrabold text-[#00e5ff]">
                    {typeof tier.priceUSD === 'number' ? formatCurrency(tier.priceUSD) : tier.priceUSD}
                  </span>
                  <span className="text-xs text-[#6b7a7d]">{tier.period}</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs text-[#8b9a9d]">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-sm text-[#00e5ff] mt-0.5">check</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onOpenCheckoutForTier(tier)}
                className={`w-full py-3 text-xs font-bold uppercase rounded transition-all ${
                  tier.recommended
                    ? 'bg-[#00e5ff] text-[#001f24] hover:bg-[#00daf3] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                    : 'bg-[#1a2635] text-[#dce4e5] hover:bg-[#00e5ff] hover:text-[#001f24]'
                }`}
              >
                {typeof tier.priceUSD === 'number' ? 'SELECT TIER' : 'CONTACT SALES'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
