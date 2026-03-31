import React, { useMemo } from 'react';
import {
  CalendarDays, AlertTriangle, Info, Sparkles,
  PartyPopper, CheckCircle2, ChevronRight
} from 'lucide-react';
import { generateRadarAlerts, type RadarAlert, type AlertSeverity } from '../services/radarEngine';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  zipCode?: string;
  country?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityConfig(severity: AlertSeverity) {
  switch (severity) {
    case 'high': return {
      border: 'border-fefo-DEFAULT/40',
      bg: 'bg-fefo-DEFAULT/5',
      badge: 'bg-fefo-DEFAULT/15 text-fefo-light border-fefo-DEFAULT/20',
      icon: <AlertTriangle className="w-5 h-5 text-fefo-light shrink-0" />,
      dot: 'bg-fefo-DEFAULT shadow-[0_0_8px_theme(colors.fefo.DEFAULT)]',
      label: 'Priorité haute',
    };
    case 'medium': return {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/5',
      badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
      icon: <Info className="w-5 h-5 text-orange-300 shrink-0" />,
      dot: 'bg-orange-400 shadow-[0_0_8px_theme(colors.orange.400)]',
      label: 'À prévoir',
    };
    default: return {
      border: 'border-inox-700',
      bg: 'bg-inox-800',
      badge: 'bg-action-DEFAULT/10 text-action-light border-action-DEFAULT/20',
      icon: <Sparkles className="w-5 h-5 text-action-light shrink-0" />,
      dot: 'bg-action-DEFAULT',
      label: 'Info',
    };
  }
}

function pluralizeDays(n: number): string {
  if (n === 0) return "Aujourd'hui / En cours";
  if (n === 1) return 'Demain';
  return `Dans ${n} jours`;
}

// ─── Sous-composant : Une Carte d'Alerte ─────────────────────────────────────

function AlertCard({ alert }: { alert: RadarAlert }) {
  const cfg = severityConfig(alert.severity);

  return (
    <div className={`flex items-start gap-4 p-4 rounded-2xl border ${cfg.border} ${cfg.bg} transition-all hover:brightness-110`}>
      {/* Dot de statut */}
      <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} shrink-0`} />
      </div>

      <div className="flex-1 min-w-0">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
          <h4 className="text-sm font-bold text-white leading-snug">{alert.title}</h4>
          <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 shrink-0 ${cfg.badge}`}>
            {pluralizeDays(alert.daysUntil)}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-inox-muted leading-relaxed">{alert.description}</p>
      </div>
    </div>
  );
}

// ─── Composant Principal ──────────────────────────────────────────────────────

export default function RadarWidget({ zipCode = '', country = 'FR' }: Props) {
  const alerts = useMemo(
    () => generateRadarAlerts({ currentDate: new Date(), zipCode, country }),
    [zipCode, country]
  );

  const highAlerts = alerts.filter(a => a.severity === 'high');
  const otherAlerts = alerts.filter(a => a.severity !== 'high');

  return (
    <section className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-inox-muted">
            Radar de Production
          </h2>
          {alerts.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-fefo-DEFAULT text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
              {alerts.length}
            </span>
          )}
        </div>
        <CalendarDays className="w-4 h-4 text-inox-muted" />
      </div>

      {/* Aucune alerte */}
      {alerts.length === 0 && (
        <div className="bg-inox-800 border border-inox-700 rounded-3xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-profit-DEFAULT/10 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7 text-profit-DEFAULT" />
          </div>
          <div>
            <p className="font-bold text-white mb-0.5">Production au vert</p>
            <p className="text-sm text-inox-muted">
              Aucun événement majeur à l'horizon. Rythme de production standard recommandé.
            </p>
          </div>
        </div>
      )}

      {/* Alertes haute priorité — mises en avant */}
      {highAlerts.length > 0 && (
        <div className="space-y-2">
          {highAlerts.map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Autres alertes en accordéon compact */}
      {otherAlerts.length > 0 && (
        <div className="bg-inox-800 border border-inox-700 rounded-3xl overflow-hidden">
          <div className="px-4 py-3 border-b border-inox-700 flex items-center gap-2">
            <PartyPopper className="w-4 h-4 text-action-light" />
            <p className="text-xs font-bold uppercase tracking-widest text-inox-muted">
              Événements à venir
            </p>
          </div>
          <div className="p-3 space-y-2">
            {otherAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
