import React, { useState } from 'react';
import { CartItem, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface CheckoutModalProps {
  item?: CartItem | null;
  items?: CartItem[];
  totalUSD?: number;
  settings: UserSettings;
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  item,
  items = [],
  totalUSD = 240,
  settings,
  onClose,
  onSuccess
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('882');
  const [cardName, setCardName] = useState('DR. E. VANCE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const displayTotalUSD = item ? item.priceUSD : items.length > 0 ? items.reduce((acc, curr) => acc + curr.priceUSD, 0) : totalUSD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsCompleted(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#020912]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c131d] border border-[#00e5ff] max-w-lg w-full p-8 rounded-lg relative font-mono-tech shadow-[0_0_30px_rgba(0,229,255,0.3)] text-[#dce4e5] overflow-hidden">
        {/* Topographic Background Decor */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#00e5ff] shadow-[0_0_12px_#00e5ff]" />

        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-[#1a2635] pb-4 mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-[#00e5ff]">lock</span>
              <h2 className="text-xl font-bold text-[#ffffff] font-display">{t.secureCheckout}</h2>
            </div>
            <span className="text-xs text-[#00e5ff] font-bold">TXN-8942-B</span>
          </div>

          <button
            onClick={onClose}
            className="text-[#6b7a7d] hover:text-[#00e5ff] transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {isCompleted ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[#4edea3]/20 border-2 border-[#4edea3] rounded-full flex items-center justify-center mx-auto text-[#4edea3] animate-bounce">
              <span className="material-symbols-outlined text-3xl font-bold">check</span>
            </div>
            <h3 className="text-xl font-bold text-[#4edea3] font-display">PAYMENT CONFIRMED</h3>
            <p className="text-xs text-[#8b9a9d]">
              Transaction receipt generated & license keys provisioned to your Vault.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Order Summary Item */}
            <div className="bg-[#020912] border border-[#1a2635] p-4 rounded flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-[#ffffff]">
                  {item ? item.title : items.length > 0 ? `${items.length} Archive Items` : 'Pro Plan - Annual'}
                </p>
                <p className="text-[10px] text-[#6b7a7d]">
                  {item ? item.subtitle : 'Uncompressed master field licenses'}
                </p>
              </div>
              <span className="text-base font-extrabold text-[#00e5ff]">
                ${displayTotalUSD.toFixed(2)} USD
              </span>
            </div>

            {/* Credit Card Number Input */}
            <div>
              <label className="block text-xs text-[#8b9a9d] mb-1.5 uppercase">Card Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 •••• •••• 4242"
                  className="technical-input rounded pr-10"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-lg text-[#00e5ff]">
                  credit_card
                </span>
              </div>
            </div>

            {/* Expiry & CVV */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8b9a9d] mb-1.5 uppercase">Expiry Date</label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  placeholder="MM/YY"
                  className="technical-input rounded"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs text-[#8b9a9d] uppercase">CVV / CVC</label>
                  <span className="material-symbols-outlined text-xs text-[#6b7a7d]" title="3 or 4 digit security code on card">
                    help_outline
                  </span>
                </div>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  placeholder="•••"
                  className="technical-input rounded"
                />
              </div>
            </div>

            {/* Cardholder Name */}
            <div>
              <label className="block text-xs text-[#8b9a9d] mb-1.5 uppercase">Cardholder Name</label>
              <input
                type="text"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                placeholder="NAME AS PRINTED ON CARD"
                className="technical-input rounded uppercase"
              />
            </div>

            {/* Security Badges */}
            <div className="flex justify-between items-center text-[10px] text-[#6b7a7d] pt-2 border-t border-[#1a2635]">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-[#4edea3]">verified_user</span>
                256-BIT SSL ENCRYPTED
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-[#00e5ff]">shield</span>
                PCI-DSS LEVEL 1 COMPLIANT
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#00e5ff] hover:bg-[#00daf3] text-[#001f24] font-bold py-3.5 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_16px_rgba(0,229,255,0.3)] flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="material-symbols-outlined text-base animate-spin">sync</span>
                  PROCESSING TRANSACTION...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {t.confirmPayment} (${displayTotalUSD.toFixed(2)})
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
