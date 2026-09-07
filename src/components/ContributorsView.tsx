import React, { useState } from 'react';
import { UserSettings } from '../types';
import { TRANSLATIONS } from '../data/mockData';

interface ContributorsViewProps {
  settings: UserSettings;
  onOpenDepositModal: () => void;
  initialMode?: 'contributors' | 'anthropology';
}

export const ContributorsView: React.FC<ContributorsViewProps> = ({
  settings,
  onOpenDepositModal,
  initialMode = 'contributors'
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.FR;
  const [viewMode, setViewMode] = useState<'contributors' | 'anthropology'>(initialMode);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; status: string }>>([
    { name: 'Oud_Arbi_Tunis_FieldRec_01.flac', size: '142 MB', status: 'In Cache' },
    { name: 'Medina_Artisans_Hammers_Ambisonic.wav', size: '280 MB', status: 'In Cache' }
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFiles(prev => [
        { name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`, status: 'Staged' },
        ...prev
      ]);
    }
  };

  const specimens = [
    {
      id: 'spec-01',
      code: '#4092-A',
      name: 'Oud Arbi (Tunisian Lute)',
      hsClassification: '321.321-5 Lutes',
      modalTaxonomy: 'M7ayer 3RA9 / Rast',
      origin: 'Tunis, North Africa',
      trait: 'Quartal Microtonal Strings',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUCAy5O4rcaRfMa3QDpbdQo8dG4jrwQ6fRcpLbZQKnZs9sRyyXTvCvaVrf4WuOWawniUegsDCBoYtoJS1Id7xL7ucTLd3-mx-1JTcK_bIrv4r5FSpzKP-9pj10_7iNBQvDoE8TH1GrxEoXOpv91qEVLG6pl3ABPcUdBsZ3Q22vbaaY-sM83bTh_nudNg4No4KqUt0HsnGEvakDKq4k6HTH93M40DhUJBuTgg8S158Ax5AZSD-2xYVBOw'
    },
    {
      id: 'spec-02',
      code: '#8821-G',
      name: 'Guembri / Sintir',
      hsClassification: '321.322 Plucked Box Lute',
      modalTaxonomy: 'Tagnaweit Ritual',
      origin: 'Morocco (Essaouira)',
      trait: 'Camel-Neck Bass Resonance',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5dMsyrETux8ZpkQXLEWwwbtoC5kI65g-AryW3-vc5FIysDkzdeOUrBsoS2dQtX_CCRN5ebzl6LY9ie92_3qrTkRN-OH9KjhQp3lZPMhoSgEpwnBHpZmdg_42ty8oYF9sMzJCAD1DjIVqvqYUbuTpbqciSl0y9gjmB3OB4VecyTKtdmyNkv66jU1VCy9qv3h6UaNXaVr093Yx3V0abB4Njh-z-BrOQz_durzUpjF8zxsO43m3vDH3c6A'
    }
  ];

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-[#020912] p-3 sm:p-6 md:p-12 pb-32 ml-14 sm:ml-20 md:ml-24 w-[calc(100%-3.5rem)] sm:w-[calc(100%-5rem)] md:w-[calc(100%-6rem)] max-w-full overflow-hidden">
      {/* Top Selector: Contributors vs Anthropology */}
      <div className="flex justify-between items-center mb-8 border-b border-[#1a2635] pb-4 font-mono-tech">
        <div>
          <span className="text-xs text-[#00e5ff] uppercase tracking-widest">
            ETHNOMUSICOLOGICAL REPOSITORY
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#dce4e5] font-display mt-1">
            {viewMode === 'contributors' ? 'Contributor Portal' : 'Anthropological Organology'}
          </h2>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-[#0c131d] border border-[#1a2635] p-1 rounded text-xs">
          <button
            onClick={() => setViewMode('contributors')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'contributors'
                ? 'bg-[#00e5ff] text-[#001f24] font-bold'
                : 'text-[#8b9a9d] hover:text-[#dce4e5]'
            }`}
          >
            {t.contributors}
          </button>
          <button
            onClick={() => setViewMode('anthropology')}
            className={`px-4 py-2 rounded transition-colors ${
              viewMode === 'anthropology'
                ? 'bg-[#00e5ff] text-[#001f24] font-bold'
                : 'text-[#8b9a9d] hover:text-[#dce4e5]'
            }`}
          >
            {t.anthropology}
          </button>
        </div>
      </div>

      {/* Contributors View */}
      {viewMode === 'contributors' ? (
        <div className="space-y-8 font-mono-tech">
          {/* Artifact Upload Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`bg-[#0c131d] border-2 border-dashed p-12 rounded text-center transition-all ${
              dragActive ? 'border-[#00e5ff] bg-[#00e5ff]/5' : 'border-[#1a2635] hover:border-[#00e5ff]/50'
            }`}
          >
            <span className="material-symbols-outlined text-5xl text-[#00e5ff] mb-4">cloud_upload</span>
            <h3 className="text-xl font-bold text-[#ffffff] font-display mb-2">
              Initialize Artifact Deposit
            </h3>
            <p className="text-xs text-[#8b9a9d] max-w-md mx-auto mb-6">
              Drag and drop high-resolution audio stems (.WAV, .FLAC, .AIFF) or click below to select from your local archivist vault.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={onOpenDepositModal}
                className="bg-[#00e5ff] hover:bg-[#00daf3] text-[#001f24] font-bold px-6 py-2.5 rounded text-xs uppercase transition-all shadow-[0_0_12px_rgba(0,229,255,0.3)]"
              >
                BROWSE LOCAL VAULT
              </button>
            </div>
          </div>

          {/* Ingestion Protocol Rules & Session Cache */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rules Card */}
            <div className="bg-[#0c131d] border border-[#1a2635] p-6 rounded">
              <h4 className="text-sm font-bold text-[#00e5ff] uppercase mb-4 border-b border-[#1a2635] pb-2">
                INGESTION PROTOCOL & STANDARDS
              </h4>
              <ul className="space-y-3 text-xs text-[#8b9a9d]">
                <li className="flex items-start gap-2">
                  <span className="text-[#00e5ff] font-bold">01.</span>
                  <span>Minimum resolution: 48kHz / 24-bit uncompressed WAV/FLAC.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00e5ff] font-bold">02.</span>
                  <span>Spatial audio requires 4-channel ambisonic A/B format metadata.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00e5ff] font-bold">03.</span>
                  <span>Mandatory geospatial lat/lng tagging for Map Indexing.</span>
                </li>
              </ul>
            </div>

            {/* Staged Cache */}
            <div className="bg-[#0c131d] border border-[#1a2635] p-6 rounded">
              <h4 className="text-sm font-bold text-[#00e5ff] uppercase mb-4 border-b border-[#1a2635] pb-2">
                SESSION STAGING CACHE ({uploadedFiles.length})
              </h4>
              <div className="space-y-3">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#020912] p-3 border border-[#1a2635] rounded text-xs">
                    <div className="truncate max-w-xs">
                      <p className="text-[#dce4e5] font-bold truncate">{f.name}</p>
                      <span className="text-[10px] text-[#6b7a7d]">{f.size}</span>
                    </div>
                    <span className="bg-[#00e5ff]/10 text-[#00e5ff] text-[10px] px-2 py-0.5 rounded border border-[#00e5ff]/30">
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Anthropology View */
        <div className="space-y-8 font-mono-tech">
          <div className="flex justify-between items-center bg-[#0c131d] border border-[#1a2635] p-6 rounded">
            <div>
              <h3 className="text-lg font-bold text-[#ffffff] font-display">Academic Organology Database</h3>
              <p className="text-xs text-[#6b7a7d]">Hornbostel-Sachs Taxonomy & Modal Field Records</p>
            </div>
            <button
              onClick={onOpenDepositModal}
              className="bg-[#fd6c00] hover:bg-[#ff8a33] text-[#020912] font-bold text-xs uppercase px-4 py-2 rounded transition-colors"
            >
              LOG NEW ARTIFACT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specimens.map((sp) => (
              <div key={sp.id} className="bg-[#0c131d] border border-[#1a2635] p-6 rounded flex gap-6">
                <img
                  src={sp.image}
                  alt={sp.name}
                  className="w-28 h-28 object-cover rounded border border-[#1a2635]"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#00e5ff] font-bold">{sp.code}</span>
                    <span className="text-[#6b7a7d] text-[10px]">{sp.origin}</span>
                  </div>
                  <h4 className="font-bold text-sm text-[#ffffff] font-display">{sp.name}</h4>
                  <p className="text-[#8b9a9d]">HS: <span className="text-[#dce4e5]">{sp.hsClassification}</span></p>
                  <p className="text-[#8b9a9d]">MODAL: <span className="text-[#00e5ff]">{sp.modalTaxonomy}</span></p>
                  <p className="text-[#8b9a9d]">ACOUSTIC: <span className="text-[#4edea3]">{sp.trait}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
