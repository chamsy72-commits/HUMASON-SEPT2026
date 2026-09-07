import React, { useState } from 'react';
import { UserSettings } from '../types';
import { MOCK_USER, TRANSLATIONS } from '../data/mockData';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const [formState, setFormState] = useState<UserSettings>({ ...settings });
  const [saveNotification, setSaveNotification] = useState(false);

  const handleSave = () => {
    onUpdateSettings(formState);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 3000);
  };

  const isLight = settings.theme === 'light';

  return (
    <div className={`w-full min-h-[calc(100vh-5rem)] p-3 sm:p-6 md:p-12 pb-32 ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] font-mono-tech transition-colors max-w-full overflow-hidden ${
      isLight ? 'bg-[#f1f5f9] text-slate-800' : 'bg-[#020912] text-[#dce4e5]'
    }`}>
      <div className={`flex justify-between items-center mb-8 border-b pb-4 ${isLight ? 'border-slate-200' : 'border-[#1a2635]'}`}>
        <div>
          <span className="text-xs text-[#0099b8] dark:text-[#00e5ff] uppercase tracking-widest">
            {t.systemPreferences}
          </span>
          <h2 className={`text-2xl md:text-3xl font-extrabold font-display mt-1 ${isLight ? 'text-slate-900' : 'text-[#dce4e5]'}`}>
            Archivist Preferences & System Config
          </h2>
        </div>

        {saveNotification && (
          <span className="bg-[#4edea3]/10 text-[#4edea3] text-xs font-bold px-4 py-2 rounded border border-[#4edea3]/30 animate-pulse">
            CONFIG SAVED SUCCESSFULLY
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Profile & Localization */}
        <div className="space-y-8">
          {/* Profile Quick Overview */}
          <div className={`border p-6 rounded-xl flex items-center gap-6 shadow-md ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'
          }`}>
            <img
              src={MOCK_USER.avatar}
              alt={MOCK_USER.name}
              className="w-16 h-16 rounded-full border-2 border-[#0099b8] dark:border-[#00e5ff]"
            />
            <div>
              <h3 className={`font-bold text-base font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>{MOCK_USER.name}</h3>
              <p className="text-xs text-[#0099b8] dark:text-[#00e5ff] font-bold">{MOCK_USER.role}</p>
              <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-[#6b7a7d]'}`}>1,402 Artifacts Catalogued • 4.2 TB Total Vault</p>
            </div>
          </div>

          {/* Interface & Localization */}
          <div className={`border p-6 rounded-xl space-y-4 shadow-md ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0c131d] border-[#1a2635]'
          }`}>
            <h3 className={`text-sm font-bold uppercase border-b pb-2 ${
              isLight ? 'text-[#0099b8] border-slate-200' : 'text-[#00e5ff] border-[#1a2635]'
            }`}>
              LOCALIZATION & REGIONAL FORMATS
            </h3>

            <div>
              <label className={`block text-xs mb-1.5 ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>{t.interfaceLanguage}</label>
              <select
                value={formState.language}
                onChange={(e) => setFormState({ ...formState, language: e.target.value as any })}
                className="technical-input rounded"
              >
                <option value="FR">Français (FR)</option>
                <option value="EN">English (EN)</option>
                <option value="AR">العربية (AR)</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs mb-1.5 ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>Market Currency</label>
              <select
                value={formState.currency}
                onChange={(e) => setFormState({ ...formState, currency: e.target.value as any })}
                className="technical-input rounded"
              >
                <option value="TND">TND - Tunisian Dinar</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="USD">USD - US Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className={`block text-xs mb-1.5 ${isLight ? 'text-slate-600' : 'text-[#8b9a9d]'}`}>{t.regionalFormatting}</label>
              <select
                value={formState.dateFormat}
                onChange={(e) => setFormState({ ...formState, dateFormat: e.target.value as any })}
                className="technical-input rounded"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (28/09/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (09/28/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-28)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Engine & Vault Security */}
        <div className="space-y-8">
          {/* Audio Engine Defaults */}
          <div className="bg-[#0c131d] border border-[#1a2635] p-6 rounded space-y-4">
            <h3 className="text-sm font-bold text-[#00e5ff] uppercase border-b border-[#1a2635] pb-2">
              AUDIO ENGINE DEFAULTS
            </h3>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-[#dce4e5] font-bold">High-Res Streaming</p>
                <p className="text-[10px] text-[#6b7a7d]">Stream uncompressed 24-bit/96kHz masters</p>
              </div>
              <input
                type="checkbox"
                checked={formState.highResStreaming}
                onChange={(e) => setFormState({ ...formState, highResStreaming: e.target.checked })}
                className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-[#dce4e5] font-bold">Spatial Binaural Rendering</p>
                <p className="text-[10px] text-[#6b7a7d]">Real-time 3D ambisonic head-related transfer function</p>
              </div>
              <input
                type="checkbox"
                checked={formState.spatialAudio}
                onChange={(e) => setFormState({ ...formState, spatialAudio: e.target.checked })}
                className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
              />
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-[#dce4e5] font-bold">Auto-play Previews</p>
                <p className="text-[10px] text-[#6b7a7d]">Play track instantly upon map node selection</p>
              </div>
              <input
                type="checkbox"
                checked={formState.autoPlay}
                onChange={(e) => setFormState({ ...formState, autoPlay: e.target.checked })}
                className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
              />
            </div>
          </div>

          {/* Vault Security */}
          <div className="bg-[#0c131d] border border-[#1a2635] p-6 rounded space-y-4">
            <h3 className="text-sm font-bold text-[#00e5ff] uppercase border-b border-[#1a2635] pb-2">
              VAULT SECURITY & ACTIVE SESSIONS
            </h3>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-[#dce4e5] font-bold">Two-Factor Authentication (2FA)</p>
                <p className="text-[10px] text-[#6b7a7d]">Require hardware security key for vault downloads</p>
              </div>
              <input
                type="checkbox"
                checked={formState.twoFactorAuth}
                onChange={(e) => setFormState({ ...formState, twoFactorAuth: e.target.checked })}
                className="w-4 h-4 accent-[#00e5ff] cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <p className="text-xs text-[#8b9a9d] mb-2">Active Archivist Session:</p>
              <div className="flex justify-between items-center bg-[#020912] p-3 border border-[#1a2635] rounded text-xs">
                <div>
                  <p className="text-[#00e5ff] font-bold">IP 192.168.1.104 (Current)</p>
                  <p className="text-[10px] text-[#6b7a7d]">macOS Sequoia • Chrome 132.0</p>
                </div>
                <button
                  onClick={() => alert('Session refreshed')}
                  className="text-[10px] text-[#fd6c00] hover:underline"
                >
                  Terminate
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => setFormState({ ...settings })}
              className="flex-1 bg-[#1a2635] hover:bg-[#25364a] text-[#dce4e5] font-bold py-3 rounded text-xs uppercase transition-colors"
            >
              DISCARD CHANGES
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-[#00e5ff] hover:bg-[#00daf3] text-[#001f24] font-bold py-3 rounded text-xs uppercase transition-colors shadow-[0_0_12px_rgba(0,229,255,0.3)]"
            >
              SAVE CONFIGURATION
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
