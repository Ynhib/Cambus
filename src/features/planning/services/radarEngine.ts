/**
 * radarEngine.ts
 * Moteur de Business Intelligence Local-First pour Cambuse.
 * Génère des alertes de production anticipées à partir de la date,
 * du code postal (zones vacances FR) et du pays.
 *
 * Architecture extensible :
 *  - Ajouter un événement → pousser dans CALENDAR_EVENTS.
 *  - Ajouter un pays → étendre EVENTS_BY_COUNTRY et SCHOOL_ZONES.
 */
import type { StreetEvent, CustomerOrder } from '../../../db/db';
import type { Holiday } from './holidayService';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'high' | 'medium' | 'info';
export type AlertCategory =
  | 'holiday_anticipation'
  | 'school_vacation'
  | 'seasonal'
  | 'country_specific';

export interface RadarAlert {
  id: string;
  title: string;
  description: string;
  emoji: string;
  severity: AlertSeverity;
  category: AlertCategory;
  daysUntil: number; // négatif = déjà passé / en cours
}

export interface CalendarEvent {
  id: string;
  getName: (year: number) => string;
  getDate: (year: number) => Date;
  anticipationDays: number; // Combien de jours avant on génère l'alerte
  alertTitle: (date: Date) => string;
  alertDescription: string;
  emoji: string;
  severity: AlertSeverity;
  category: AlertCategory;
  countries: string[]; // ['FR', 'LU', 'DE', 'ALL'] — 'ALL' = partout
}

// ─── Calculs Calendaires ──────────────────────────────────────────────────────

/**
 * Algorithme de Butcher pour calculer la date de Pâques (calendrier Grégorien).
 */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Dimanche de Pentecôte = Pâques + 49 jours */
export function getPentecostDate(year: number): Date {
  const easter = getEasterDate(year);
  easter.setDate(easter.getDate() + 49);
  return easter;
}

/** Fête des Mères FR : dernier dimanche de mai, sauf si Pentecôte → premier dimanche de juin */
export function getFeteDesMeresDate(year: number): Date {
  const pente = getPentecostDate(year);
  // Dernier dimanche de mai
  const lastSundayMay = new Date(year, 5, 0); // 30 mai environ
  lastSundayMay.setDate(lastSundayMay.getDate() - lastSundayMay.getDay());
  if (
    lastSundayMay.getMonth() === pente.getMonth() &&
    lastSundayMay.getDate() === pente.getDate()
  ) {
    // Conflit : déplace au premier dimanche de juin
    const firstSundayJune = new Date(year, 5, 1);
    firstSundayJune.setDate(1 + (7 - firstSundayJune.getDay()) % 7);
    return firstSundayJune;
  }
  return lastSundayMay;
}

/** Fête des Pères FR : 3ème dimanche de juin */
export function getFeteDesPeres(year: number): Date {
  const date = new Date(year, 5, 1); // 1er juin
  const firstSunday = new Date(date);
  firstSunday.setDate(1 + (7 - date.getDay()) % 7);
  firstSunday.setDate(firstSunday.getDate() + 14); // +2 semaines
  return firstSunday;
}

/** Aide : nombre de jours entre today et targetDate */
function daysUntil(target: Date, today: Date): number {
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const n = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((t.getTime() - n.getTime()) / 86_400_000);
}

// ─── Catalogue d'Événements ───────────────────────────────────────────────────

const CALENDAR_EVENTS: CalendarEvent[] = [
  // ── Pâques ──
  {
    id: 'easter',
    getName: () => 'Pâques',
    getDate: getEasterDate,
    anticipationDays: 21,
    alertTitle: (d) => `🐰 Pâques le ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
    alertDescription:
      'Démarrez la production des moulages chocolat, œufs et cloches. ' +
      "Anticipez les commandes en gros d'au moins 2 semaines.",
    emoji: '🐰',
    severity: 'high',
    category: 'holiday_anticipation',
    countries: ['ALL'],
  },
  // ── Épiphanie ──
  {
    id: 'epiphany',
    getName: () => 'Épiphanie (Jour des Rois)',
    getDate: (y) => new Date(y, 0, 6),
    anticipationDays: 10,
    alertTitle: () => '👑 Épiphanie approche',
    alertDescription:
      "Vérifiez vos stocks de beurre, poudre d'amande et fèves. " +
      "La galette des rois représente un pic de chiffre d'affaires non négligeable.",
    emoji: '👑',
    severity: 'high',
    category: 'holiday_anticipation',
    countries: ['FR', 'LU', 'BE'],
  },
  // ── Saint-Valentin ──
  {
    id: 'valentine',
    getName: () => 'Saint-Valentin',
    getDate: (y) => new Date(y, 1, 14),
    anticipationDays: 7,
    alertTitle: () => "💝 Saint-Valentin dans moins d'une semaine",
    alertDescription:
      'Préparez vos créations chocolat en forme de cœur, macarons roses et petits gâteaux romantiques. ' +
      'Hausse des achats impulsifs de 1 à 3 jours avant le 14.',
    emoji: '💝',
    severity: 'medium',
    category: 'holiday_anticipation',
    countries: ['FR', 'LU', 'BE', 'DE'],
  },
  // ── Fête des Mères ──
  {
    id: 'mothers_day',
    getName: () => 'Fête des Mères',
    getDate: getFeteDesMeresDate,
    anticipationDays: 10,
    alertTitle: () => '💐 Fête des Mères approche',
    alertDescription:
      'Mettez en avant vos coffrets cadeaux gourmands et créations fleuries en pâtisserie. ' +
      'Forte demande de boîtes de chocolats et gâteaux personnalisés.',
    emoji: '💐',
    severity: 'medium',
    category: 'holiday_anticipation',
    countries: ['FR', 'LU', 'BE'],
  },
  // ── Fête des Pères ──
  {
    id: 'fathers_day',
    getName: () => 'Fête des Pères',
    getDate: getFeteDesPeres,
    anticipationDays: 7,
    alertTitle: () => "🧔 Fête des Pères dans moins d'une semaine",
    alertDescription:
      'Pensez aux assortiments "cadeau homme" : tablettes noires, pralinés, coffrets bière & snacking.',
    emoji: '🧔',
    severity: 'info',
    category: 'holiday_anticipation',
    countries: ['FR', 'LU', 'BE'],
  },
  // ── Noël ──
  {
    id: 'christmas',
    getName: () => 'Noël',
    getDate: (y) => new Date(y, 11, 25),
    anticipationDays: 30,
    alertTitle: () => '🎄 Noël approche (J-30 ou moins)',
    alertDescription:
      "Lancez la production des bûches, orangettes, chocolats de Noël et pain d'épices. " +
      "Commandez vos matières premières saisonnières dès maintenant.",
    emoji: '🎄',
    severity: 'high',
    category: 'holiday_anticipation',
    countries: ['ALL'],
  },
  // ── Halloween ──
  {
    id: 'halloween',
    getName: () => 'Halloween',
    getDate: (y) => new Date(y, 9, 31),
    anticipationDays: 14,
    alertTitle: () => '🎃 Halloween se prépare',
    alertDescription:
      'Préparez vos créations "horreur chic" : chocolats citrouille, bonbons, cake-pops monstre. ' +
      'Marché en forte croissance, surtout en milieu urbain.',
    emoji: '🎃',
    severity: 'info',
    category: 'holiday_anticipation',
    countries: ['FR', 'LU', 'BE', 'DE'],
  },
  // ── Carnaval (DE/LU) ──
  {
    id: 'carnival',
    getName: () => 'Carnaval',
    getDate: (y) => {
      const easter = getEasterDate(y);
      easter.setDate(easter.getDate() - 47); // Mardi gras = Pâques - 47
      return easter;
    },
    anticipationDays: 14,
    alertTitle: () => '🎭 Carnaval / Faschingsdienstag approche',
    alertDescription:
      'Beignets, Berliner, Krapfen : pics de ventes importants. Prévoyez doubles stocks de friture et confiture.',
    emoji: '🎭',
    severity: 'medium',
    category: 'country_specific',
    countries: ['DE', 'LU'],
  },
  // ── 1er de l'An / Jour de l'An ──
  {
    id: 'new_year',
    getName: () => "Jour de l'An",
    getDate: (y) => new Date(y, 0, 1),
    anticipationDays: 7,
    alertTitle: () => "🥂 Nouvel An dans moins d'une semaine",
    alertDescription:
      'Pic de demande pour les mignardises et bouchées de réveillon. Pensez aux coffrets festifs.',
    emoji: '🥂',
    severity: 'medium',
    category: 'holiday_anticipation',
    countries: ['ALL'],
  },
];

// ─── Zones de Vacances Scolaires Françaises ───────────────────────────────────

type ZoneFR = 'A' | 'B' | 'C';

/** Correspondance département → Zone scolaire française */
const FR_ZONE_MAP: Record<string, ZoneFR> = {
  // Zone A
  '01': 'A', '03': 'A', '07': 'A', '15': 'A', '26': 'A', '38': 'A',
  '42': 'A', '43': 'A', '63': 'A', '69': 'A', '73': 'A', '74': 'A',
  '67': 'A', '68': 'A', '25': 'A', '39': 'A', '70': 'A', '90': 'A',
  '21': 'A', '58': 'A', '71': 'A', '89': 'A',
  // Zone B
  '08': 'B', '10': 'B', '51': 'B', '52': 'B', '54': 'B', '55': 'B',
  '57': 'B', '88': 'B', '02': 'B', '59': 'B', '60': 'B', '62': 'B',
  '80': 'B', '14': 'B', '27': 'B', '50': 'B', '61': 'B', '76': 'B',
  '18': 'B', '28': 'B', '36': 'B', '37': 'B', '41': 'B', '45': 'B',
  '72': 'B', '49': 'B', '53': 'B', '85': 'B', '44': 'B',
  // Zone C (Paris + Centre + Etc.)
  '75': 'C', '77': 'C', '78': 'C', '91': 'C', '92': 'C', '93': 'C',
  '94': 'C', '95': 'C', '94': 'C',
};

/**
 * Calendrier simpliste des vacances scolaires françaises 2025-2026.
 * Structure: { zone: Array<[startISO, endISO]> }
 * À maintenir manuellement ou à connecter à l'API data.education.gouv.fr.
 */
const FR_VACANCES_2025_2026: Record<ZoneFR, Array<[string, string]>> = {
  A: [
    ['2025-10-18', '2025-11-03'],
    ['2025-12-20', '2026-01-05'],
    ['2026-02-07', '2026-02-23'],
    ['2026-04-04', '2026-04-20'],
    ['2026-07-05', '2026-09-01'],
  ],
  B: [
    ['2025-10-25', '2025-11-10'],
    ['2025-12-20', '2026-01-05'],
    ['2026-02-14', '2026-03-02'],
    ['2026-04-11', '2026-04-27'],
    ['2026-07-05', '2026-09-01'],
  ],
  C: [
    ['2025-10-18', '2025-11-03'],
    ['2025-12-20', '2026-01-05'],
    ['2026-02-21', '2026-03-09'],
    ['2026-04-18', '2026-05-04'],
    ['2026-07-05', '2026-09-01'],
  ],
};

function isInVacances(zone: ZoneFR, today: Date): boolean {
  return FR_VACANCES_2025_2026[zone].some(([start, end]) => {
    const s = new Date(start);
    const e = new Date(end);
    return today >= s && today <= e;
  });
}

function getDaysUntilNextVacances(zone: ZoneFR, today: Date): number | null {
  const upcoming = FR_VACANCES_2025_2026[zone]
    .map(([start]) => new Date(start))
    .filter(d => d > today)
    .sort((a, b) => a.getTime() - b.getTime());
  if (upcoming.length === 0) return null;
  return daysUntil(upcoming[0], today);
}

// ─── Moteur Principal ─────────────────────────────────────────────────────────

interface RadarEngineInput {
  currentDate?: Date;
  zipCode?: string; // Code postal (5 chiffres FR, ou format LU/DE)
  country?: string; // 'FR' | 'LU' | 'DE' | 'BE' | …
  holidays?: Holiday[]; // Jours fériés pré-chargés
}

/**
 * Génère les alertes radar calibrées sur la date, le code postal et le pays.
 * @returns RadarAlert[] triées par sévérité puis daysUntil
 */
export function generateRadarAlerts({
  currentDate = new Date(),
  zipCode = '',
  country = 'FR',
  holidays = [],
}: RadarEngineInput): RadarAlert[] {
  const alerts: RadarAlert[] = [];
  const year = currentDate.getFullYear();
  const countryCode = country.toUpperCase();

  // ── 0. Jours Fériés (Smart Detection) ──────────────────────────────────
  for (const h of holidays) {
    const hDate = new Date(h.date);
    const diff = daysUntil(hDate, currentDate);

    // Aujourd'hui = FERMÉ
    if (diff === 0) {
      alerts.push({
        id: `holiday-today-${h.date}`,
        title: `🏮 FERMÉ (Férié : ${h.name})`,
        description: `Aujourd'hui est un jour férié (${h.localName}). La production est désactivée. Profitez-en pour vous reposer !`,
        emoji: '🏮',
        severity: 'high',
        category: 'holiday_anticipation',
        daysUntil: 0,
      });
    } 
    // J-1 à J-7 = ANTICIPATION
    else if (diff > 0 && diff <= 7) {
      alerts.push({
        id: `holiday-soon-${h.date}`,
        title: `🔔 ${h.name} dans ${diff} jour${diff > 1 ? 's' : ''}`,
        description: diff === 1 
          ? `⚠️ Veille de jour férié ! +40% de production recommandé pour anticiper la fermeture de demain.`
          : `Anticipez la fermeture du ${hDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}. Commandez vos matières premières.`,
        emoji: '🔔',
        severity: diff <= 3 ? 'high' : 'medium',
        category: 'holiday_anticipation',
        daysUntil: diff,
      });
    }
  }

  // ── 1. Événements du calendrier ──────────────────────────────────────────
  for (const event of CALENDAR_EVENTS) {
    // Filtre par pays
    if (!event.countries.includes('ALL') && !event.countries.includes(countryCode)) {
      continue;
    }

    // Calcule la date this year et next year (pour gérer les événements "passés")
    for (const checkYear of [year, year + 1]) {
      const eventDate = event.getDate(checkYear);
      const diff = daysUntil(eventDate, currentDate);

      // On génère l'alerte si on est dans la fenêtre d'anticipation
      if (diff >= 0 && diff <= event.anticipationDays) {
        alerts.push({
          id: `${event.id}-${checkYear}`,
          title: event.alertTitle(eventDate),
          description: event.alertDescription,
          emoji: event.emoji,
          severity: event.severity,
          category: event.category,
          daysUntil: diff,
        });
        break; // Ne pas dupliquer
      }
    }
  }

  // ── 2. Vacances Scolaires (France uniquement) ─────────────────────────────
  if (countryCode === 'FR' && zipCode.length >= 2) {
    const dept = zipCode.slice(0, 2);
    const zone = FR_ZONE_MAP[dept];

    if (zone) {
      const inVac = isInVacances(zone, currentDate);
      if (inVac) {
        alerts.push({
          id: 'school_vacation_now',
          title: `🎒 Vacances scolaires — Zone ${zone} en cours`,
          description:
            'Ajustez votre production de snacking : baisse du flux lycéen/étudiant, ' +
            'hausse possible des familles. Pensez aux formats partage et coffrets.',
          emoji: '🎒',
          severity: 'medium',
          category: 'school_vacation',
          daysUntil: 0,
        });
      } else {
        const daysUntilVac = getDaysUntilNextVacances(zone, currentDate);
        if (daysUntilVac !== null && daysUntilVac <= 14) {
          alerts.push({
            id: 'school_vacation_soon',
            title: `🎒 Vacances scolaires (Zone ${zone}) dans ${daysUntilVac} jour${daysUntilVac > 1 ? 's' : ''}`,
            description:
              'Anticipez le changement de flux client. Stockez les formats familiaux et réduisez les portions individuelles.',
            emoji: '🎒',
            severity: 'info',
            category: 'school_vacation',
            daysUntil: daysUntilVac,
          });
        }
      }
    }
  }

  // ── 3. Alerte saisonnière générique (été / hiver) ─────────────────────────
  const month = currentDate.getMonth(); // 0-indexed
  if (month >= 5 && month <= 7) {
    // Juin, Juillet, Août
    alerts.push({
      id: 'seasonal_summer',
      title: '☀️ Période estivale : Misez sur le snacking froid',
      description:
        'Glacés, sorbets, barres de céréales et boissons fraîches sont en tête. ' +
        'Réduisez les chocolats chauds saisonniers.',
      emoji: '☀️',
      severity: 'info',
      category: 'seasonal',
      daysUntil: 0,
    });
  } else if (month === 10 || month === 11 || month === 0) {
    // Nov, Déc, Jan
    alerts.push({
      id: 'seasonal_winter',
      title: '🧣 Saison froide : Boostez les produits réconfortants',
      description:
        "Chocolats chauds, pains d'épices, spéculoos et boissons chaudes sont plébiscités. " +
        'Anticipez les ventes de coffrets cadeaux.',
      emoji: '🧣',
      severity: 'info',
      category: 'seasonal',
      daysUntil: 0,
    });
  }

  // ── Tri : high > medium > info, puis par daysUntil croissant ─────────────
  const severityOrder: Record<AlertSeverity, number> = { high: 0, medium: 1, info: 2 };
  return alerts.sort((a, b) => {
    const sev = severityOrder[a.severity] - severityOrder[b.severity];
    return sev !== 0 ? sev : a.daysUntil - b.daysUntil;
  });
}

// ─── Impact Calendrier Externe (iCal) ─────────────────────────────────────────

export function analyzeCalendarImpact(events: StreetEvent[]) {
  let totalMinutesLost = 0;
  let recommendation: string | null = null;

  // On filtre les événements d'agenda externe non terminés
  const externalEvents = events.filter(e => e.source === 'EXTERNAL' && !e.isCompleted);

  for (const evt of externalEvents) {
     // Les événements externes (via sync) utilisent l'impact calculé lors du parsing iCal
     if (evt.impact === 'HIGH') {
        recommendation = "Baisse drastique de production recommandée (Absence/Fermeture détectée dans l'agenda).";
        totalMinutesLost += 240; // Demi-journée perdue
     } else if (evt.impact === 'MEDIUM') {
        recommendation = "Ajustez vos fournées : Indisponibilité temporaire (RDV/Livraison) en approche.";
        totalMinutesLost += 120; // 2 heures perdues
     }
  }
  
  // Hypothèse : base 8 heures d'ouverture (480 mins)
  const lostPercentage = Math.min((totalMinutesLost / 480) * 100, 100);

  return { recommendation, lostPercentage };
}

// ─── Score Global de Charge de Travail (Workload Temperature) ────────────────

export interface WorkloadMetrics {
  score: number;       // de 0 à 100
  label: string;       // "Calme", "Modéré", "Charge Élevée", "Critique"
  lostPercentage: number;
}

export function calculateWorkloadScore(
  currentDate: Date,
  zipCode: string,
  country: string,
  activeEvents: StreetEvent[],
  activeOrders: CustomerOrder[]
): WorkloadMetrics {
  let score = 0;
  
  // 1. Alertes de calendrier / Radar
  const radarAlerts = generateRadarAlerts({ currentDate, zipCode, country });
  for (const alert of radarAlerts) {
    if (alert.daysUntil <= 3) {
      if (alert.severity === 'high') score += 30;
      else if (alert.severity === 'medium') score += 15;
      else score += 5;
    }
  }

  // 2. Commandes (Chaque commande pending = +10% de charge)
  const pendingOrdersCount = activeOrders.filter(o => o.status === 'PENDING').length;
  score += pendingOrdersCount * 10;

  // 3. Impact Manifestations Locales (hors externes)
  const impactMap = { LOW: 5, MEDIUM: 15, HIGH: 30 };
  const localEvents = activeEvents.filter(e => e.source !== 'EXTERNAL' && !e.isCompleted);
  for (const evt of localEvents) {
    // Si c'est aujourd'hui ou dans les 3 prochains jours
    const diff = Math.round((new Date(evt.date).getTime() - currentDate.getTime()) / 86400000);
    if (diff >= 0 && diff <= 3) {
      score += impactMap[evt.impact] || 0;
    }
  }

  // 4. Pénalité des indisponibilités externes (iCal)
  const calImpact = analyzeCalendarImpact(activeEvents);
  score += Math.round(calImpact.lostPercentage * 0.5); // L'absence sature la charge de "travail restant possible"

  score = Math.min(score, 100);

  let label = "Calme";
  if (score >= 80) label = "Critique (Surchauffe)";
  else if (score >= 50) label = "Charge Élevée";
  else if (score >= 20) label = "Modéré";

  return { score, label, lostPercentage: calImpact.lostPercentage };
}
