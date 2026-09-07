import React, { useEffect } from 'react';
import { CartItem, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface CartModalProps {
  items: CartItem[];
  settings: UserSettings;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  items,
  settings,
  onRemoveItem,
  onClearCart,
  onClose,
  onProceedToCheckout
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;

  const totalUSD = items.reduce((acc, curr) => acc + curr.priceUSD, 0);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatPrice = (usd: number) => {
    if (settings.currency === 'EUR') return `€${Math.round(usd * 0.92)}`;
    if (settings.currency === 'TND') return `${Math.round(usd * 3.1)} TND`;
    return `$${usd}`;
  };

  const isLight = settings.theme === 'light';

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono-tech animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-lg rounded-2xl border p-6 md:p-8 flex flex-col justify-between shadow-2xl transition-all max-h-[85vh] overflow-hidden ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50' 
            : 'bg-[#1E202E] border-[#2A2D3E] text-[#FFFFFF] shadow-[0_0_35px_rgba(0,229,255,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div className={`flex justify-between items-center border-b pb-4 mb-5 ${isLight ? 'border-slate-200' : 'border-[#2A2D3E]'}`}>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.25)]">
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
              </div>
              <div>
                <h2 className={`text-xl font-extrabold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>PANIER D'ARCHIVES</h2>
                <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
                  {items.length} {items.length > 1 ? 'enregistrements sélectionnés' : 'enregistrement sélectionné'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#12131C] hover:bg-[#2A2D3E] text-[#94A3B8] hover:text-white'
              }`}
              title="Continuer mes recherches"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Cart Items List */}
          {items.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-[#94A3B8] space-y-4">
              <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-[#2A2D3E]">remove_shopping_cart</span>
              <p className="font-bold text-sm text-white">Votre panier d'archives est vide</p>
              <p className="text-[11px] max-w-xs mx-auto text-[#94A3B8]">Explorez la bibliothèque ou l'atlas géographique pour ajouter des stems ethnographiques.</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#12131C] font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-2 mx-auto"
              >
                <span className="material-symbols-outlined text-base">search</span>
                Explorer la Bibliothèque
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border flex justify-between items-center text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#12131C] border-[#2A2D3E]'
                  }`}
                >
                  <div className="truncate max-w-[260px]">
                    <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                    <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>{item.subtitle}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-[#00E5FF] text-sm">{formatPrice(item.priceUSD)}</span>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 rounded text-slate-400 dark:text-[#94A3B8] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Supprimer"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className={`border-t pt-5 mt-4 space-y-4 ${isLight ? 'border-slate-200' : 'border-[#2A2D3E]'}`}>
            <div className="flex justify-between items-center text-sm">
              <span className={isLight ? 'text-slate-600 font-bold' : 'text-[#94A3B8] font-bold'}>SOUS-TOTAL COMMERCIAL:</span>
              <span className="text-2xl font-black text-[#00E5FF] font-display">{formatPrice(totalUSD)}</span>
            </div>

            {/* Action buttons: Checkout + Continue Searching */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={onClose}
                className={`font-bold py-3 px-4 rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 transition-all ${
                  isLight 
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                    : 'bg-[#12131C] border border-[#2A2D3E] text-[#94A3B8] hover:text-white hover:border-[#00E5FF]/40'
                }`}
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Continuer mes recherches
              </button>
              
              <button
                onClick={onClearCart}
                className={`font-bold py-3 px-3 rounded-xl text-xs uppercase transition-colors ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#12131C] text-[#94A3B8] hover:text-red-400 border border-[#2A2D3E]'
                }`}
                title="Vider le panier"
              >
                Vider
              </button>

              <button
                onClick={onProceedToCheckout}
                className="flex-1 bg-[#D4AF37] hover:bg-[#B8952B] text-[#12131C] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex justify-center items-center gap-2"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                {t.confirmPayment}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
