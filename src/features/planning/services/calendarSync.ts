import { db } from '../../../db/db';

/**
 * Nettoie et formate une date iCal (ex: 20231225T153000Z) en objet Date
 */
function parseICalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Format simple YYYYMMDD
  if (dateStr.length === 8) {
    return new Date(
      parseInt(dateStr.substring(0, 4)),
      parseInt(dateStr.substring(4, 6)) - 1,
      parseInt(dateStr.substring(6, 8))
    );
  }
  
  // Format complet avec Heure (Z = UTC)
  const match = dateStr.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (match) {
    const [, year, month, day, hour, min, sec, isUTC] = match;
    const dateObj = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec)
    );
    if (isUTC) {
      // Ajustement UTC
      return new Date(Date.UTC(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(min),
        parseInt(sec)
      ));
    }
    return dateObj;
  }
  return null;
}

/**
 * Un parseur iCal ultra-léger (Client-side, Zéro Dépendance)
 * Gère le multi-ligne (.ics fold) et extrait les blocs VEVENT.
 */
function lightICalParser(icsData: string) {
  // Déplier les lignes coupées (spécification iCal)
  const unfolded = icsData.replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);
  
  const events = [];
  let currentEvent: any = null;

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {};
    } else if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.SUMMARY && currentEvent.DTSTART) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const splitIdx = line.indexOf(':');
      if (splitIdx > -1) {
        let key = line.substring(0, splitIdx);
        const value = line.substring(splitIdx + 1);
        
        // Supprimer les paramètres de clé (ex: DTSTART;TZID=Europe/Paris)
        if (key.includes(';')) {
          key = key.split(';')[0];
        }
        
        currentEvent[key] = value;
      }
    }
  }
  return events;
}

/**
 * Synchronise un calendrier externe (Google, Apple, etc.) et le sauvegarde dans Dexie.
 * Note: Utilise corsproxy.io pour contourner les protections CORS des navigateurs.
 */
export async function syncExternalCalendar(url: string) {
  try {
    // Contournement CORS pour un usage client pur
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Erreur réseau lors de la récupération du calendrier');
    
    const icsData = await response.text();
    const parsedEvents = lightICalParser(icsData);
    
    let addedCount = 0;

    for (const evt of parsedEvents) {
      const dtStart = parseICalDate(evt.DTSTART);
      if (!dtStart) continue;

      // On filtre les événements trop vieux (antérieurs à aujourd'hui moins 30j)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (dtStart < thirtyDaysAgo) continue;

      const title = evt.SUMMARY || 'Sans titre';
      const uid = evt.UID || `${title}-${evt.DTSTART}`;
      const description = evt.DESCRIPTION || '';

      // On évalue l'impact : les mots "fermé", "congé", "vacances" = Fort (Absence)
      let impact: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      const textToAnalyze = `${title} ${description}`.toLowerCase();
      
      if (textToAnalyze.includes('fermé') || textToAnalyze.includes('congé') || textToAnalyze.includes('vacances')) {
        impact = 'HIGH';
      } else if (textToAnalyze.includes('rdv') || textToAnalyze.includes('livraison')) {
        impact = 'MEDIUM'; // Peut couper la prod 1h ou 2
      }

      // Vérifier si l'événement existe déjà dans Dexie
      const existing = await db.events.where('externalId').equals(uid).first();

      if (!existing) {
        await db.events.add({
          title: evt.SUMMARY,
          date: dtStart.toISOString(),
          endDate: evt.DTEND ? parseICalDate(evt.DTEND)?.toISOString() : undefined,
          type: 'LOCAL_EVENT',
          impact,
          description: description.substring(0, 100), // Tronqué pour l'affichage
          isCompleted: false,
          source: 'EXTERNAL',
          externalId: uid
        });
        addedCount++;
      }
    }
    
    return { success: true, addedCount };
  } catch (err) {
    console.error("Erreur Sync iCal:", err);
    return { success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}
