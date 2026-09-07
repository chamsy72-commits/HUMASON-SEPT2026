import React from 'react';
import { AppTab, Language, UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface SideNavBarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  cartCount: number;
  onOpenCart: () => void;
  settings: UserSettings;
  onOpenPlatformInfo?: () => void;
  isAdminAuthenticated?: boolean;
}

export const SideNavBar: React.FC<SideNavBarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  onOpenCart,
  settings,
  onOpenPlatformInfo,
  isAdminAuthenticated
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;

  const navItems: { id: AppTab; label: string; icon: string; badge?: string }[] = [
    { id: 'library', label: t.library || 'Bibliothèque', icon: 'storefront' },
    { id: 'explorer', label: t.explorer || 'Atlas', icon: 'public' },
    { id: 'packs', label: t.packs, icon: 'album' },
    { id: 'pro', label: t.pro, icon: 'workspace_premium' },
    { id: 'contributors', label: t.contributors, icon: 'groups' },
    { id: 'anthropology', label: t.anthropology, icon: 'history_edu' }
  ];

  const isLight = settings.theme === 'light';

  return (
    <nav className={`fixed left-0 top-0 h-full w-14 sm:w-20 md:w-24 border-r flex flex-col items-center py-3 sm:py-4 z-50 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0B0E14] border-[#222B3D] text-[#F8FAFC]'
    }`}>
      {/* Brand Logo */}
      <div className="mb-4 sm:mb-6 mt-1 sm:mt-2 flex flex-col items-center justify-center">
        <button 
          onClick={() => setActiveTab('library')}
          className="group focus:outline-none"
          title="HUMASON Marketplace - Bibliothèque"
        >
          <span className="font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#00A6D6] tracking-tighter group-hover:scale-110 transition-transform">
            H
          </span>
        </button>
      </div>

      {/* Main Tab Links (Admin space is strictly omitted from the sidebar) */}
      <div className="flex-1 flex flex-col space-y-3 w-full items-center">
        {navItems.map((item) => {
          const isActive = activeTab === item.id || (activeTab === 'anthropology' && item.id === 'contributors');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full py-3 px-1 transition-all text-xs font-mono-tech ${
                isActive
                  ? isLight
                    ? 'text-[#00A6D6] border-l-2 border-[#00A6D6] bg-slate-100 font-bold'
                    : 'text-[#00A6D6] border-l-2 border-[#00A6D6] bg-[#131822] shadow-[inset_4px_0_0_rgba(0,166,214,0.3)]'
                  : isLight
                    ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    : 'text-[#94A3B8] hover:bg-[#131822] hover:text-[#F8FAFC]'
              }`}
            >
              <span className={`material-symbols-outlined mb-1 text-2xl ${isActive ? 'fill' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] tracking-wider text-center break-words w-full px-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className={`mt-auto flex flex-col w-full items-center space-y-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-[#222B3D]'}`}>
        {/* Cart Button */}
        <button
          onClick={onOpenCart}
          className="relative w-11 h-11 rounded-full bg-[#D9532F] text-white flex items-center justify-center hover:bg-[#BA4120] transition-all shadow-md hover:scale-105"
          title="Shopping Cart"
        >
          <span className="material-symbols-outlined text-xl">shopping_cart</span>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#00A6D6] text-[#0B0E14] font-mono-tech text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white dark:border-[#0B0E14]">
              {cartCount}
            </span>
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center w-full py-2.5 px-1 font-mono-tech text-xs transition-all ${
            activeTab === 'settings'
              ? isLight
                ? 'text-[#00A6D6] border-l-2 border-[#00A6D6] bg-slate-100'
                : 'text-[#00A6D6] border-l-2 border-[#00A6D6] bg-[#131822]'
              : isLight
                ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                : 'text-[#94A3B8] hover:bg-[#131822] hover:text-[#F8FAFC]'
          }`}
          title={t.settings}
        >
          <span className={`material-symbols-outlined text-xl ${activeTab === 'settings' ? 'fill' : ''}`}>
            settings
          </span>
          <span className="text-[10px] tracking-wider">{t.settings}</span>
        </button>
      </div>
    </nav>
  );
};
