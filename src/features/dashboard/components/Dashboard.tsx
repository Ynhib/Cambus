import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Flame, BellRing, MapPin
} from 'lucide-react';
import WeatherWidget from '../../weather/components/WeatherWidget';
import EventWidget from '../../planning/components/EventWidget';
import LocalAlertForm from '../../impact/components/LocalAlertForm';
import { calculateImpact, loadShopInfo, saveShopInfo, type StreetAlert, type StreetEventType, type GeoLocation, type ShopInfo } from '../../impact/services/impactLogic';
import LocationOnboarding from '../../impact/components/LocationOnboarding';
import RadarWidget from '../../planning/components/RadarWidget';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import { calculateWorkloadScore } from '../../planning/services/radarEngine';

const INITIAL_ALERTS: StreetAlert[] = [
  { id: '1', title: 'Réfection trottoir', type: 'TRAVAUX', location: { lat: 48.8566, lng: 2.3524 } } 
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(loadShopInfo());
  const shopLocation = shopInfo?.location ?? null;
  const zipCode = shopInfo?.street?.match(/\b(\d{5})\b/)?.[1] ?? '';
  const [isConfiguringShop, setIsConfiguringShop] = useState(false);
  const [alerts, setAlerts] = useState<StreetAlert[]>(INITIAL_ALERTS);

  const activeEvents = useLiveQuery(() => db.events.toArray()) || [];
  const activeOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const workload = calculateWorkloadScore(new Date(), zipCode, 'FR', activeEvents, activeOrders);

  const handleSaveShop = (info: ShopInfo) => {
    saveShopInfo(info);
    setShopInfo(info);
    setIsConfiguringShop(false);
  };

  const handleAddAlert = (title: string, type: StreetEventType, location: GeoLocation) => {
    setAlerts(prev => [{ id: Date.now().toString(), title, type, location }, ...prev]);
  };

  const processedAlerts = alerts
    .map(alert => ({
      ...alert,
      impact: shopLocation ? calculateImpact(alert.location, shopLocation, alert.type) : null
    }))
    .filter(a => a.impact && a.impact.distanceMeters < 500);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-action-DEFAULT to-action-dark flex items-center justify-center shadow-inox-glow">
              <Flame className="w-6 h-6 text-white" strokeWidth={2.5} />
            </span>
            Cambuse
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <p className="text-sm text-inox-muted">{t('dashboard.title')}</p>
             {shopLocation && (
               <span className="text-[10px] bg-action-DEFAULT/10 text-action-light px-2 py-0.5 rounded-full border border-action-DEFAULT/20 font-bold uppercase tracking-tighter">
                 {shopInfo?.cityName ?? 'Boutique Active'}
               </span>
             )}
          </div>
        </div>
        <button className="p-3 bg-inox-800 rounded-full border border-inox-700 active:scale-95 transition-transform hover:bg-inox-700 group">
          <BellRing className="w-6 h-6 text-inox-muted group-hover:text-action-light transition-colors" />
        </button>
      </header>

      {!shopLocation ? (
        /* Welcome Gate */
        <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-action-DEFAULT to-action-dark flex items-center justify-center shadow-inox-glow mb-8 animate-bounce" style={{ animationDuration: '3s' }}>
             <MapPin className="w-12 h-12 text-white" />
           </div>
           <h2 className="text-3xl font-extrabold text-white mb-4">Bienvenue sur Cambuse</h2>
           <p className="text-inox-muted max-w-md mb-10 text-lg leading-relaxed">
             Pour activer votre radar de quartier et votre météo personnalisée, 
             définissez l'emplacement de votre boutique en <strong>une seule fois</strong>.
           </p>
           <div className="w-full max-w-xl text-left">
             <LocationOnboarding onComplete={handleSaveShop} />
           </div>
        </div>
      ) : (
        /* Dashboard complet une fois configuré */
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
            
            {/* ─── Colonne Gauche ─── */}
            <div className="lg:col-span-6 xl:col-span-5 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <WeatherWidget shopLocation={shopLocation} />

              {/* Alertes FEFO */}
              <section>
                <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted mb-3">
                  {t('fefo.section_title')}
                </h2>
                <div className="bg-inox-800 p-6 md:p-5 rounded-3xl border border-fefo-DEFAULT/40 shadow-inox relative overflow-hidden active:scale-95 transition-transform">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fefo-DEFAULT/10 rounded-bl-[100px]" />
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-fefo-DEFAULT/15 flex items-center justify-center text-fefo-light shrink-0">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{t('fefo.alerts_title')}</h3>
                      <p className="text-base text-fefo-light font-medium">
                        {t('fefo.expires_tomorrow_plural', { count: 3 })}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* ─── Colonne Droite ─── */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              
              {/* Moteur Radar BI */}
              <RadarWidget
                zipCode={shopInfo?.street?.match(/\b(\d{5})\b/)?.[1] ?? ''}
                country="FR"
              />

              {/* Planning Agenda */}
              <div>
                <EventWidget />
              </div>

              {/* Alertes de Rue (Géofencing) */}
              <section>
                <div className="flex justify-between items-end mb-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted">
                    Alertes de Rue (Impact Local)
                  </h2>
                  <button 
                    onClick={() => setIsConfiguringShop(true)}
                    className="text-[10px] font-bold uppercase tracking-widest text-action-light hover:text-white transition-colors"
                  >
                    Modifier l'adresse boutique
                  </button>
                </div>
                
                {isConfiguringShop ? (
                  <div className="mb-6 animate-in zoom-in-95">
                    <LocationOnboarding onComplete={(info) => { handleSaveShop(info); setIsConfiguringShop(false); }} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-4">
                      {processedAlerts.length > 0 ? (
                        <div className="space-y-3">
                          {processedAlerts.map(alert => (
                            <div key={alert.id} className={`p-4 rounded-2xl border ${alert.impact?.color} shadow-inox bg-opacity-10 animate-in fade-in`}>
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-white">{alert.title}</h3>
                                <span className="text-xs font-bold bg-black/40 px-2 py-1 rounded-lg text-white">
                                  À {alert.impact?.distanceMeters}m
                                </span>
                              </div>
                              <p className="text-sm font-medium">{alert.impact?.impactText}</p>
                              <div className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">
                                Impact prévisionnel : {alert.impact?.impactValue! > 0 ? '+' : ''}{alert.impact?.impactValue}% flux
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-inox-muted text-sm font-medium bg-inox-800 p-4 rounded-2xl border border-inox-700">Aucun événement perturbateur à moins de 500m.</p>
                      )}
                      
                      <LocalAlertForm onAddAlert={handleAddAlert} shopLocation={shopLocation} />
                    </div>

                    {/* Minimap pour Desktop */}
                    <div className="hidden xl:flex flex-col items-center justify-center bg-inox-800 border border-inox-700 rounded-3xl p-6 relative shadow-inox group overflow-hidden">
                       <div className="text-xs font-bold uppercase tracking-widest text-inox-muted mb-6">Radar 500m</div>
                       <div className="w-48 h-48 rounded-full border border-dashed border-action-DEFAULT/30 relative flex items-center justify-center bg-inox-900/50">
                         <div className="w-3 h-3 bg-action-DEFAULT rounded-full absolute z-10 shadow-[0_0_15px_#22d3ee]" />
                         <div className="w-full h-full border border-action-DEFAULT/10 rounded-full absolute animate-ping duration-3000" style={{ animationDuration: '3s' }} />
                         <div className="w-1/2 h-1/2 border border-action-DEFAULT/10 rounded-full absolute" />
                         {processedAlerts.map((alert, idx) => {
                           const dist = alert.impact!.distanceMeters;
                           const ratio = Math.min(dist / 500, 1); 
                           const angle = (idx * 137.5) * (Math.PI / 180); 
                           const x = Math.cos(angle) * (ratio * 50) + 50; 
                           const y = Math.sin(angle) * (ratio * 50) + 50; 
                           const isTravaux = alert.type === 'TRAVAUX';
                           return (
                             <div 
                               key={`dot-${alert.id}`}
                               className={`absolute w-3 h-3 rounded-full border-2 border-inox-900 ${isTravaux ? 'bg-fefo-DEFAULT shadow-[0_0_10px_#ef4444]' : 'bg-blue-400 shadow-[0_0_10px_#60a5fa]'}`}
                               style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                             />
                           );
                         })}
                       </div>
                       <button onClick={() => setIsConfiguringShop(true)} className="absolute inset-0 bg-inox-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                         <span className="text-xs font-bold text-white bg-action-DEFAULT px-4 py-2 rounded-xl">Changer l'adresse</span>
                       </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Zone de Lancement de production */}
          <div className="space-y-4 pt-4">
            {workload.lostPercentage > 0 && (
              <div className="bg-fefo-DEFAULT/15 border border-fefo-DEFAULT/40 p-5 rounded-3xl flex gap-4 text-fefo-light animate-in fade-in slide-in-from-bottom-4 items-center">
                <div className="bg-fefo-DEFAULT/20 p-3 rounded-2xl shrink-0">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-widest mb-1 text-white">⚠️ Indisponibilité détectée ce jour</h4>
                  <p className="text-sm font-medium">L'analyse de votre agenda personnel recommande d'ajuster vos fournées. Possibilité de surchauffe logistique.</p>
                </div>
              </div>
            )}
            
            <button className={`w-full ${workload.score >= 80 ? 'bg-fefo-DEFAULT hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : workload.score >= 50 ? 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-action-DEFAULT hover:bg-action-dark shadow-inox-glow'} text-white p-6 rounded-3xl font-bold transition-all active:scale-[0.98] flex items-center justify-between text-lg group`}>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Flame className="w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <span className="block text-xl md:text-2xl">{t('dashboard.launch_production')}</span>
                  <span className="text-xs opacity-90 font-bold uppercase tracking-widest mt-1 block">
                    Charge estimée : {workload.label} ({workload.score}/100)
                  </span>
                </div>
              </div>
              <div className="w-14 h-14 bg-black/20 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-black/30 transition-colors">
                GO
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
