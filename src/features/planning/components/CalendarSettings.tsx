import React, { useState } from 'react';
import { X, RefreshCw, Link as LinkIcon, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { syncExternalCalendar } from '../services/calendarSync';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarSettings({ isOpen, onClose }: Props) {
  const [icalUrl, setIcalUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSync = async () => {
    if (!icalUrl.trim()) return;
    
    setIsSyncing(true);
    setSyncStatus(null);
    
    try {
      const result = await syncExternalCalendar(icalUrl.trim());
      if (result.success) {
        setSyncStatus({ success: true, message: `Synchronisation réussie. ${result.addedCount} événement(s) ajouté(s).` });
        // Simuler la durée de dernière synchro
        localStorage.setItem('lastSyncDate', new Date().toISOString());
      } else {
        setSyncStatus({ success: false, message: result.error || 'Erreur de synchronisation.' });
      }
    } catch (err) {
      setSyncStatus({ success: false, message: "Impossible de joindre le calendrier." });
    } finally {
      setIsSyncing(false);
    }
  };

  const lastSync = localStorage.getItem('lastSyncDate');
  const syncAgoToStr = lastSync ? 
    `il y a ${Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)} min` : 
    'Jamais';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-inox-800 border border-inox-700 rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-inox-700">
          <div className="flex items-center gap-3">
            <div className="bg-inox-900 p-2 rounded-xl text-inox-muted">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-wider">
                Vos Agendas
              </h2>
              <p className="text-xs font-medium text-inox-muted">
                Connectez Google Agenda, Apple ou Proton
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-inox-muted hover:text-white transition-colors bg-inox-900 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-inox-900/50 p-5 rounded-2xl border border-inox-700/50">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-action-light" />
              Lien secret iCal (.ics)
            </h3>
            <p className="text-xs text-inox-muted mb-4 leading-relaxed">
              Allez dans les paramètres de votre calendrier, trouvez <strong>l'adresse secrète au format iCal</strong>, copiez-la et collez-la ci-dessous.
            </p>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={icalUrl}
                onChange={e => setIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                className="flex-1 bg-inox-900 border border-inox-700 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-action-DEFAULT focus:ring-1 focus:ring-action-DEFAULT/40 transition-all font-mono"
              />
              <button
                onClick={handleSync}
                disabled={isSyncing || !icalUrl.trim()}
                className="bg-action-DEFAULT hover:bg-action-dark text-inox-900 font-bold px-5 rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchro...' : 'Synchroniser'}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-medium">
            <span className="text-inox-muted uppercase tracking-widest">
              Dernière synchro : <span className="text-white">{syncAgoToStr}</span>
            </span>
          </div>

          {syncStatus && (
            <div className={`flex items-start gap-3 p-4 rounded-2xl border text-sm animate-in fade-in slide-in-from-bottom-2 ${
              syncStatus.success 
                ? 'bg-profit-DEFAULT/10 border-profit-DEFAULT/20 text-profit-light' 
                : 'bg-fefo-DEFAULT/10 border-fefo-DEFAULT/20 text-fefo-light'
            }`}>
              {syncStatus.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p className="font-bold">{syncStatus.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
