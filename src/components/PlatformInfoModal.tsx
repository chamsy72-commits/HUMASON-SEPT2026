import React from 'react';
import { UserSettings } from '../types';

interface PlatformInfoModalProps {
  settings: UserSettings;
  onClose: () => void;
}

export const PlatformInfoModal: React.FC<PlatformInfoModalProps> = ({
  settings,
  onClose
}) => {
  const isLight = settings.theme === 'light';

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono-tech transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`max-w-2xl w-full rounded-2xl border p-6 md:p-8 shadow-2xl relative transition-all transform scale-100 ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-400/30' 
            : 'bg-[#0c131d] border-[#00e5ff] text-[#dce4e5] shadow-[0_0_35px_rgba(0,229,255,0.25)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-[#1a2635] hover:bg-[#253548] text-[#8b9a9d] hover:text-white'
          }`}
          title="Fermer"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 border-b pb-4 border-slate-200 dark:border-[#1a2635]">
          <div className="w-12 h-12 rounded-xl bg-[#0099b8]/10 dark:bg-[#00e5ff]/10 border border-[#0099b8] dark:border-[#00e5ff] flex items-center justify-center text-[#0099b8] dark:text-[#00e5ff] font-black text-2xl font-display shadow-xs">
            H
          </div>
          <div>
            <h2 className="text-2xl font-black font-display text-[#0099b8] dark:text-[#00e5ff] tracking-tight">
              HUMASON
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#8b9a9d]'}`}>
              Plateforme d'Archivage Ethno-Acoustique & WebGIS Soundscapes
            </p>
          </div>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* SECTION 1: ARABIC DEFINITION (تعريف المنصة) */}
          <div className={`p-5 rounded-xl border relative overflow-hidden ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020912] border-[#1a2635]'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b pb-2 border-slate-200 dark:border-[#1a2635]">
              <span className="text-xs font-bold text-[#fd6c00] flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">menu_book</span>
                تعريف المنصة • Introduction
              </span>
              <span className="text-[10px] bg-[#0099b8]/10 dark:bg-[#00e5ff]/10 text-[#0099b8] dark:text-[#00e5ff] font-bold px-2 py-0.5 rounded border border-[#0099b8]/30 dark:border-[#00e5ff]/30">
                العربية
              </span>
            </div>

            {/* Arabic Main Description */}
            <p className="text-right text-base leading-relaxed font-sans font-medium text-slate-900 dark:text-slate-100 dir-rtl mb-3" dir="rtl">
              منصة <strong className="text-[#0099b8] dark:text-[#00e5ff]">هيوماซون (HUMASON)</strong> هي أرشيف رقمي وإثنوغرافي متطور للمشاهد الصوتية والتراث الصوتي في شمال إفريقيا والمغرب العربي. تهدف المنصة إلى تجميع، توثيق وحفظ التسجيلات الصوتية عالية الدقة بنظام الصوت ثلاثي الأبعاد (3D Spatial) والـAmbisonic، مع إمكانية تحديد المواقع بدقة متناهية عبر خريطة تفاعلية لخدمة الباحثين، الفنانين ومنتجي الموسيقى.
            </p>

            {/* French Translation Subtitle */}
            <p className={`text-xs leading-relaxed font-sans italic border-t pt-2.5 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-[#1a2635] text-[#bac9cc]'
            }`}>
              "HUMASON est un réceptacle ethno-acoustique et cartographique dédié au patrimoine sonore d'Afrique du Nord. La plateforme préserve et géolocalise les empreintes acoustiques en haute résolution 3D Spatial."
            </p>
          </div>

          {/* SECTION 2: PLATFORM CONSTRUCTORS / BUILDERS (Constructeurs de la plateforme) */}
          <div className={`p-5 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#020912] border-[#1a2635]'
          }`}>
            <div className="flex items-center gap-2 mb-4 border-b pb-2 border-slate-200 dark:border-[#1a2635]">
              <span className="material-symbols-outlined text-base text-[#0099b8] dark:text-[#00e5ff]">engineering</span>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                1. Les Constructeurs & Architekten de la Plateforme
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-[#fd6c00]">record_voice_over</span>
                  <span className="font-bold text-slate-900 dark:text-white">Chamsy</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Fondateur, Audio Ethnographe & Concepteur Sonore Principal
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-[#0099b8] dark:text-[#00e5ff]">developer_board</span>
                  <span className="font-bold text-slate-900 dark:text-white">HUMASON Sound Lab</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Développement WebGIS & Synthétiseur WebAudio 3D
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-[#4edea3]">groups</span>
                  <span className="font-bold text-slate-900 dark:text-white">Collectif d'Archivistes</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Réseau de prise de son (Sousse, Tunis, Alger, Casablanca)
                </p>
              </div>

              <div className={`p-3 rounded-lg border ${isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm text-[#fd6c00]">map</span>
                  <span className="font-bold text-slate-900 dark:text-white">Spatial Precision Engine</span>
                </div>
                <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>
                  Cartographie Interactive Haute Fidéllité & GPS
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-[#1a2635] flex justify-between items-center text-xs">
          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-[#6b7a7d]'}`}>
            HUMASON Vault v2.4 • Sound Archive Protocol
          </span>
          <button
            onClick={onClose}
            className="bg-[#0099b8] dark:bg-[#00e5ff] text-white dark:text-[#001f24] font-bold px-5 py-2 rounded-lg hover:opacity-90 transition-all shadow-xs"
          >
            Compris / حسناً
          </button>
        </div>
      </div>
    </div>
  );
};
