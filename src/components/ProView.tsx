import React, { useState } from 'react';
import { Transaction, UserProfile, UserSettings, SoundItem } from '../types';
import { INITIAL_TRANSACTIONS, MOCK_USER, TRANSLATIONS } from '../data/mockData';
import { AdminView } from './AdminView';

interface ProViewProps {
  settings: UserSettings;
  onOpenUpgradeModal: () => void;
  sounds?: SoundItem[];
  onAddSound?: (sound: SoundItem) => void;
  onUpdateSound?: (sound: SoundItem) => void;
  onDeleteSound?: (soundId: string) => void;
  onNavigateToAtlas?: (sound?: SoundItem) => void;
  isAdminAuthenticated?: boolean;
  onAdminAuthenticated?: () => void;
}

export const ProView: React.FC<ProViewProps> = ({
  settings,
  onOpenUpgradeModal,
  sounds = [],
  onAddSound = () => {},
  onUpdateSound = () => {},
  onDeleteSound = () => {},
  onNavigateToAtlas,
  isAdminAuthenticated = false,
  onAdminAuthenticated = () => {}
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const isLight = settings.theme === 'light';

  const [activeSubTab, setActiveSubTab] = useState<'billing' | 'personal' | 'security' | 'admin'>('billing');
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);

  // Admin password unlock within Pro View
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const user: UserProfile = MOCK_USER;

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      if (adminPassword === 'NOUZA2006') {
        onAdminAuthenticated();
        setAdminPassword('');
      } else {
        setAdminError('Mot de passe Administrateur incorrect. Veuillez saisir "NOUZA2006".');
      }
    }, 350);
  };

  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["INV CODE,TITLE,DATE,AMOUNT USD,STATUS", ...transactions.map(t => `${t.invCode},"${t.title}",${t.date},$${t.amountUSD},${t.status}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HUMASON_Ledger_${user.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full min-h-[calc(100vh-5rem)] p-3 sm:p-6 md:p-10 pb-32 ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] max-w-full overflow-hidden transition-colors ${
      isLight ? 'bg-[#F8FAFC] text-slate-800' : 'bg-[#0B0E14] text-[#F8FAFC]'
    }`}>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: User Profile & Sub-Navigation */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {/* Profile Card */}
          <div className={`border p-6 rounded-2xl font-mono-tech flex flex-col items-center text-center transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#131822] border-[#222B3D] shadow-md'
          }`}>
            <div className="w-20 h-20 rounded-full border-2 border-[#00A6D6] overflow-hidden mb-4 p-0.5 shadow-[0_0_16px_rgba(0,166,214,0.3)]">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className={`font-bold text-lg font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</h3>
            <span className="text-xs text-[#00A6D6] font-bold">{user.role}</span>
            <span className="text-[10px] text-[#64748B] mt-1">{user.id}</span>
          </div>

          {/* Vault Storage Bar */}
          <div className={`border p-6 rounded-2xl font-mono-tech ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
          }`}>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className={isLight ? 'text-slate-600 uppercase font-bold' : 'text-[#94A3B8] uppercase'}>{t.vaultStorage}</span>
              <span className="text-[#00A6D6] font-bold">78%</span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden mb-2 ${isLight ? 'bg-slate-100' : 'bg-[#1E2738]'}`}>
              <div className="h-full bg-gradient-to-r from-[#00A6D6] to-[#C99738] w-[78%] shadow-[0_0_8px_#00A6D6]" />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>{user.vaultUsedGB} GB Utilisés</span>
              <span>{user.vaultMaxGB} GB Alloués</span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className={`border rounded-2xl overflow-hidden font-mono-tech text-xs shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
          }`}>
            <button
              onClick={() => setActiveSubTab('billing')}
              className={`w-full text-left px-5 py-3.5 border-b flex items-center justify-between transition-colors ${
                isLight ? 'border-slate-100' : 'border-[#222B3D]'
              } ${
                activeSubTab === 'billing'
                  ? isLight
                    ? 'bg-slate-100 text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                    : 'bg-[#171E2C] text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#171E2C]'
              }`}
            >
              <span>Abonnement & Factures</span>
              <span className="material-symbols-outlined text-sm">credit_card</span>
            </button>

            <button
              onClick={() => setActiveSubTab('personal')}
              className={`w-full text-left px-5 py-3.5 border-b flex items-center justify-between transition-colors ${
                isLight ? 'border-slate-100' : 'border-[#222B3D]'
              } ${
                activeSubTab === 'personal'
                  ? isLight
                    ? 'bg-slate-100 text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                    : 'bg-[#171E2C] text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#171E2C]'
              }`}
            >
              <span>Coordonnées Chercheur</span>
              <span className="material-symbols-outlined text-sm">person</span>
            </button>

            <button
              onClick={() => setActiveSubTab('security')}
              className={`w-full text-left px-5 py-3.5 border-b flex items-center justify-between transition-colors ${
                isLight ? 'border-slate-100' : 'border-[#222B3D]'
              } ${
                activeSubTab === 'security'
                  ? isLight
                    ? 'bg-slate-100 text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                    : 'bg-[#171E2C] text-[#00A6D6] font-bold border-l-4 border-l-[#00A6D6]'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-50'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#171E2C]'
              }`}
            >
              <span>Sécurité & 2FA</span>
              <span className="material-symbols-outlined text-sm">lock</span>
            </button>

            {/* Admin Dedicated Sub-Tab */}
            <button
              onClick={() => setActiveSubTab('admin')}
              className={`w-full text-left px-5 py-3.5 flex items-center justify-between transition-all ${
                activeSubTab === 'admin'
                  ? isLight
                    ? 'bg-[#C99738]/15 text-[#C99738] font-bold border-l-4 border-l-[#C99738]'
                    : 'bg-[#C99738]/15 text-[#C99738] font-bold border-l-4 border-l-[#C99738]'
                  : isLight
                    ? 'text-amber-800 hover:bg-amber-50/60 font-semibold'
                    : 'text-[#C99738] hover:text-white hover:bg-[#171E2C]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#C99738]">admin_panel_settings</span>
                <span>Console Admin Studio</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#C99738]/20 text-[#C99738] border border-[#C99738]/40 font-bold">
                {isAdminAuthenticated ? 'DÉVERROUILLÉ' : 'VERROUILLÉ'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Column: Main Sub-Tab View */}
        <div className="flex-1 min-w-0">
          {/* TAB 1: Billing */}
          {activeSubTab === 'billing' && (
            <div className="space-y-8">
              {/* Active Subscription Box */}
              <div className={`border p-6 sm:p-8 rounded-2xl font-mono-tech shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                isLight
                  ? 'bg-white border-cyan-500/30'
                  : 'bg-[#131822] border-[#00A6D6]/40 shadow-[0_0_24px_rgba(0,166,214,0.15)]'
              }`}>
                <div>
                  <span className="bg-[#00A6D6]/15 text-[#00A6D6] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#00A6D6]/40 uppercase tracking-widest">
                    LICENCE ACTIVE
                  </span>
                  <h2 className={`text-2xl font-bold font-display mt-2.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {user.planName}
                  </h2>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>
                    ${user.planPriceUSD}.00 / mois • Renouvellement : {user.nextRenewal}
                  </p>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-[#64748B]'}`}>
                    Mode de règlement : Carte bancaire se terminant par •••• {user.paymentCardLast4}
                  </p>
                </div>

                <button
                  onClick={onOpenUpgradeModal}
                  className="px-6 py-3 rounded-xl bg-[#00A6D6] hover:bg-[#0093BE] text-[#0B0E14] font-bold text-xs uppercase transition-all shadow-[0_0_14px_rgba(0,166,214,0.35)] shrink-0"
                >
                  PASSER AU FORFAIT INSTITUTIONNEL
                </button>
              </div>

              {/* Transaction Ledger */}
              <div className={`border p-6 rounded-2xl font-mono-tech ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
              }`}>
                <div className={`flex justify-between items-center mb-6 border-b pb-4 ${isLight ? 'border-slate-100' : 'border-[#222B3D]'}`}>
                  <div>
                    <h3 className={`text-lg font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>Grand Livre des Transactions</h3>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-[#64748B]'}`}>Factures de licences et justificatifs d'achats audio</p>
                  </div>
                  <button
                    onClick={handleDownloadCSV}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-[#1E2738] hover:bg-[#00A6D6] hover:text-[#0B0E14] text-[#F8FAFC]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    EXPORTER CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={`border-b ${isLight ? 'text-slate-500 border-slate-200' : 'text-[#64748B] border-[#222B3D]'}`}>
                        <th className="pb-3 font-normal">FACTURE</th>
                        <th className="pb-3 font-normal">DESCRIPTION</th>
                        <th className="pb-3 font-normal">DATE</th>
                        <th className="pb-3 font-normal">MONTANT</th>
                        <th className="pb-3 font-normal">STATUT</th>
                        <th className="pb-3 font-normal text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-slate-100 text-slate-800' : 'divide-[#222B3D]/50 text-[#F8FAFC]'}`}>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-[#171E2C]/50'}>
                          <td className="py-3.5 text-[#00A6D6] font-bold">{tx.invCode}</td>
                          <td className="py-3.5">{tx.title}</td>
                          <td className={`py-3.5 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>{tx.date}</td>
                          <td className="py-3.5 font-bold">${tx.amountUSD.toFixed(2)}</td>
                          <td className="py-3.5">
                            <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => setSelectedInvoice(tx)}
                              className={`transition-colors ${isLight ? 'text-slate-400 hover:text-[#00A6D6]' : 'text-[#64748B] hover:text-[#00A6D6]'}`}
                              title="Voir la facture"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Personal */}
          {activeSubTab === 'personal' && (
            <div className={`border p-6 sm:p-8 rounded-2xl font-mono-tech ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <h3 className={`text-xl font-bold font-display mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Informations Personnelles & Laboratoire</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-[#222B3D]'}`}>
                  <span className="text-[#64748B] block mb-1">Nom complet</span>
                  <span className="font-bold text-sm">{user.name}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-[#222B3D]'}`}>
                  <span className="text-[#64748B] block mb-1">Identifiant Archiviste</span>
                  <span className="font-bold text-sm text-[#00A6D6]">{user.id}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-[#222B3D]'}`}>
                  <span className="text-[#64748B] block mb-1">Affiliation Scientifique</span>
                  <span className="font-bold text-sm">Centre des Musiques Arabes et Méditerranéennes (CMAM)</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-[#222B3D]'}`}>
                  <span className="text-[#64748B] block mb-1">Spécialité</span>
                  <span className="font-bold text-sm text-[#C99738]">Organologie & Acoustique Maghrébine</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Security */}
          {activeSubTab === 'security' && (
            <div className={`border p-6 sm:p-8 rounded-2xl font-mono-tech ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#131822] border-[#222B3D]'
            }`}>
              <h3 className={`text-xl font-bold font-display mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>Sécurité du Compte & Clés API</h3>
              <p className={`text-xs mb-6 ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>
                Protégez vos téléchargements haute fidélité avec l'authentification multifacteur et vos jetons cryptographiques de recherche.
              </p>
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#171E2C] border-[#222B3D]'
                }`}>
                  <div>
                    <h4 className="font-bold text-xs">Authentification à deux facteurs (2FA)</h4>
                    <p className="text-[11px] text-[#64748B]">Validation par application d'authentification</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                    ACTIVÉ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Admin Studio Workspace (Embedded inside Client Area) */}
          {activeSubTab === 'admin' && (
            <div>
              {!isAdminAuthenticated ? (
                /* Admin Password Authentication Gate */
                <div className={`border p-8 rounded-2xl font-mono-tech max-w-xl mx-auto my-6 text-center ${
                  isLight
                    ? 'bg-white border-amber-300 shadow-md'
                    : 'bg-[#131822] border-[#C99738]/40 shadow-[0_0_30px_rgba(201,151,56,0.15)]'
                }`}>
                  <div className="w-16 h-16 rounded-2xl bg-[#C99738]/15 border border-[#C99738]/40 text-[#C99738] flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="material-symbols-outlined text-3xl">lock</span>
                  </div>

                  <h3 className={`text-2xl font-bold font-display ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Espace d'Administration HUMASON
                  </h3>
                  <p className={`text-xs mt-2 max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>
                    Veuillez renseigner votre mot de passe administrateur pour accéder à la console de gestion des sons et au studio de découpe par locateurs.
                  </p>

                  <form onSubmit={handleAdminLoginSubmit} className="mt-6 space-y-4 max-w-md mx-auto text-left">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[#C99738]">
                        Mot de passe Administrateur
                      </label>
                      <div className="relative">
                        <span className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isLight ? 'text-slate-400' : 'text-[#64748B]'}`}>
                          key
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Entrez le mot de passe Admin (NOUZA2006)..."
                          required
                          autoFocus
                          className={`w-full pl-9 pr-10 py-3 rounded-xl border text-sm font-mono-tech outline-none transition-all ${
                            isLight
                              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#C99738]'
                              : 'bg-[#0B0E14] border-[#222B3D] text-white focus:border-[#C99738]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#C99738]"
                        >
                          <span className="material-symbols-outlined text-base">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {adminError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm shrink-0">error</span>
                        <span>{adminError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying || !adminPassword}
                      className="w-full py-3 rounded-xl bg-[#C99738] hover:bg-[#AF812A] disabled:opacity-50 text-[#0B0E14] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(201,151,56,0.3)]"
                    >
                      {isVerifying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-[#0B0E14]/30 border-t-[#0B0E14] rounded-full animate-spin" />
                          <span>Vérification...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">lock_open</span>
                          <span>Déverrouiller la Console Admin</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-[#222B3D] text-[11px] text-[#64748B]">
                    Clé d'authentification réservée aux conservateurs et ingénieurs du son.
                  </div>
                </div>
              ) : (
                /* Authenticated Admin View Embedded */
                <div className="rounded-2xl overflow-hidden border border-[#222B3D] shadow-xl">
                  <AdminView
                    sounds={sounds}
                    onAddSound={onAddSound}
                    onUpdateSound={onUpdateSound}
                    onDeleteSound={onDeleteSound}
                    settings={settings}
                    onNavigateToAtlas={onNavigateToAtlas}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`border max-w-lg w-full p-8 rounded-2xl relative font-mono-tech shadow-2xl ${
            isLight
              ? 'bg-white border-cyan-500/40 text-slate-800'
              : 'bg-[#131822] border-[#00A6D6] text-[#F8FAFC] shadow-[0_0_30px_rgba(0,166,214,0.25)]'
          }`}>
            <div className="flex justify-between items-start border-b border-[#222B3D] pb-4 mb-6">
              <div>
                <h3 className="text-xl text-[#00A6D6] font-bold">JUSTIFICATIF HUMASON</h3>
                <p className="text-xs text-[#94A3B8]">{selectedInvoice.invCode}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-[#64748B] hover:text-[#00A6D6]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs mb-8">
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-2">
                <span className="text-[#64748B]">BÉNÉFICIAIRE :</span>
                <span>Dr. E. Vance ({user.id})</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-2">
                <span className="text-[#64748B]">DATE :</span>
                <span>{selectedInvoice.date}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-2">
                <span className="text-[#64748B]">DESCRIPTION :</span>
                <span>{selectedInvoice.title}</span>
              </div>
              <div className="flex justify-between border-b border-[#222B3D]/50 pb-2">
                <span className="text-[#64748B]">STATUT DE RÈGLEMENT :</span>
                <span className="text-emerald-400 font-bold">{selectedInvoice.status}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#00A6D6] pt-2">
                <span>TOTAL RÉGLÉ :</span>
                <span>${selectedInvoice.amountUSD.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="flex-1 bg-[#1E2738] text-[#F8FAFC] hover:bg-[#00A6D6] hover:text-[#0B0E14] font-bold py-2.5 rounded-xl text-xs uppercase transition-colors"
              >
                {t.close}
              </button>
              <button
                onClick={handleDownloadCSV}
                className="flex-1 bg-[#00A6D6] text-[#0B0E14] font-bold py-2.5 rounded-xl text-xs uppercase hover:bg-[#0093BE] transition-colors"
              >
                IMPRIMER REÇU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
