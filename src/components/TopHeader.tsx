import React from 'react';
import { Currency, Language, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface TopHeaderProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenClientArea: () => void;
  onOpenPlatformInfo: () => void;
  isAdminAuthenticated?: boolean;
  onOpenAdmin?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  settings,
  onUpdateSettings,
  searchQuery,
  setSearchQuery,
  onOpenClientArea,
  onOpenPlatformInfo,
  isAdminAuthenticated,
  onOpenAdmin
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;

  const handleLangChange = (lang: Language) => {
    onUpdateSettings({ language: lang });
  };

  const handleCurrencyChange = (curr: Currency) => {
    onUpdateSettings({ currency: curr });
  };

  const toggleTheme = () => {
    onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const isLight = settings.theme === 'light';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md transition-colors border-b h-16 sm:h-20 px-3 sm:px-6 md:px-12 flex justify-between items-center ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] max-w-full overflow-hidden ${
      isLight 
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-xs' 
        : 'bg-[#0B0E14]/90 border-[#222B3D] text-[#F8FAFC]'
    }`}>
      {/* Brand Title & Search */}
      <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 min-w-0 shrink">
        <button
          onClick={onOpenPlatformInfo}
          className="flex items-center gap-1.5 group text-left focus:outline-none shrink-0"
          title="Cliquez pour afficher les Constructeurs & la Présentation HUMASON"
        >
          <h1 className="font-extrabold text-lg sm:text-2xl md:text-3xl text-[#00A6D6] tracking-tight font-display group-hover:opacity-90 transition-opacity">
            HUMASON
          </h1>
          <span className="material-symbols-outlined text-xs sm:text-base text-[#D9532F] bg-[#D9532F]/10 p-0.5 sm:p-1 rounded-full border border-[#D9532F]/30 group-hover:scale-110 transition-transform">
            info
          </span>
        </button>

        {/* Admin Badge or Button */}
        {isAdminAuthenticated ? (
          <button
            onClick={onOpenAdmin}
            className="hidden xs:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-1 rounded-lg bg-[#C99738]/15 text-[#C99738] border border-[#C99738]/40 hover:bg-[#C99738] hover:text-[#0B0E14] font-mono-tech shrink-0 transition-all shadow-[0_0_8px_rgba(201,151,56,0.2)]"
            title="Accéder à la Console Admin & Traitement Audio"
          >
            <span className="material-symbols-outlined text-xs">admin_panel_settings</span>
            ADMIN STUDIO
          </button>
        ) : (
          <button
            onClick={onOpenAdmin}
            className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-[#1E2738] text-[#94A3B8] hover:text-[#C99738] border border-[#222B3D] hover:border-[#C99738]/40 font-mono-tech shrink-0 transition-all"
            title="Connexion Espace Admin (Mot de passe: NOUZA2006)"
          >
            <span className="material-symbols-outlined text-xs">lock</span>
            Admin
          </button>
        )}

        <div className={`hidden xl:block h-6 w-px ${isLight ? 'bg-slate-200' : 'bg-[#222B3D]'}`} />
        <span className={`hidden xl:block font-mono-tech text-xs uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
          {t.tagline}
        </span>

        {/* Search input */}
        <div className="relative hidden lg:block">
          <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-slate-400' : 'text-[#64748B]'}`}>
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`pl-9 pr-4 py-1.5 bg-transparent border-b text-xs font-mono-tech outline-none w-36 focus:w-48 transition-all ${
              isLight
                ? 'border-slate-300 focus:border-[#00A6D6] text-slate-800 placeholder-slate-400'
                : 'border-[#222B3D] focus:border-[#00A6D6] text-white placeholder-[#64748B]'
            }`}
          />
        </div>
      </div>

      {/* Control Actions & Controls */}
      <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6 font-mono-tech text-xs text-[#94A3B8] shrink-0">
        {/* Languages */}
        <div className="flex items-center space-x-0.5 sm:space-x-1 border-r border-[#222B3D] pr-1.5 sm:pr-4">
          {(['FR', 'EN', 'AR'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => handleLangChange(lang)}
              className={`px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] transition-colors ${
                settings.language === lang
                  ? 'text-[#00A6D6] font-bold bg-[#00A6D6]/10'
                  : 'hover:text-[#D9532F]'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Currency Switcher */}
        <div className="hidden sm:flex items-center space-x-1 border-r border-[#222B3D] pr-4">
          {(['EUR', 'TND', 'USD'] as Currency[]).map((curr) => (
            <button
              key={curr}
              onClick={() => handleCurrencyChange(curr)}
              className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                settings.currency === curr
                  ? 'text-[#00A6D6] font-bold bg-[#00A6D6]/10'
                  : 'hover:text-[#D9532F]'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="text-[#94A3B8] hover:text-[#00A6D6] transition-colors p-1"
          title="Toggle Theme"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl">
            {settings.theme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        {/* Client Area Button */}
        <button
          onClick={onOpenClientArea}
          className="bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-bold px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-mono-tech rounded-xl transition-all shadow-[0_0_12px_rgba(0,166,214,0.3)] hover:shadow-[0_0_18px_rgba(0,166,214,0.5)] uppercase tracking-wider whitespace-nowrap"
        >
          <span className="hidden sm:inline">{t.clientArea}</span>
          <span className="sm:hidden">ESPACE CLIENT</span>
        </button>
      </div>
    </header>
  );
};
