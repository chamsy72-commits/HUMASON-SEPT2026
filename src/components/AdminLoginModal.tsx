import React, { useState } from 'react';
import { UserSettings } from '../types';

interface AdminLoginModalProps {
  settings: UserSettings;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  settings,
  onClose,
  onSuccess
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLight = settings.theme === 'light';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      if (password === 'NOUZA2006') {
        setIsLoading(false);
        onSuccess();
      } else {
        setIsLoading(false);
        setErrorMsg('Mot de passe Administrateur incorrect. Veuillez saisir "NOUZA2006".');
      }
    }, 350);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono-tech animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`max-w-md w-full rounded-2xl border p-6 md:p-8 shadow-2xl relative transition-all ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/50' 
            : 'bg-[#131822] border-[#C99738]/50 text-[#F8FAFC] shadow-[0_0_35px_rgba(201,151,56,0.2)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1E2738] hover:bg-[#2A374E] text-[#94A3B8] hover:text-white'
          }`}
          title="Fermer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Admin Lock Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#C99738]/15 border border-[#C99738]/40 flex items-center justify-center text-[#C99738] mb-3 shadow-md">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h2 className={`text-xl font-extrabold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Accès Console Administrateur
          </h2>
          <p className={`text-xs mt-1.5 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
            L'accès aux locateurs audio, au catalogage master et à la suppression est sécurisé.
          </p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${
              isLight ? 'text-slate-700' : 'text-[#C99738]'
            }`}>
              Mot de passe Administrateur
            </label>
            <div className="relative">
              <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                isLight ? 'text-slate-400' : 'text-[#64748B]'
              }`}>
                key
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Saisissez le mot de passe Admin..."
                required
                autoFocus
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm font-mono-tech outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-[#C99738] focus:bg-white'
                    : 'bg-[#0B0E14] border-[#222B3D] text-white focus:border-[#C99738]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                  isLight ? 'text-slate-400 hover:text-slate-600' : 'text-[#64748B] hover:text-[#C99738]'
                }`}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-[#1E2738] text-[#94A3B8] hover:text-white'
              }`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !password}
              className="bg-[#C99738] hover:bg-[#AF812A] disabled:opacity-50 text-[#0B0E14] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#0B0E14]/30 border-t-[#0B0E14] rounded-full animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">lock_open</span>
                  <span>Déverrouiller Admin</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className={`mt-6 pt-4 border-t text-[10px] text-center ${
          isLight ? 'border-slate-200 text-slate-400' : 'border-[#222B3D] text-[#64748B]'
        }`}>
          🔐 Sécurité HUMASON • Protection d'accès aux dépôts d'archives
        </div>
      </div>
    </div>
  );
};
