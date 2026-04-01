/**
 * holidayService.ts
 * Service de détection des jours fériés nationaux et locaux (FR/LU/DE).
 * Utilise l'API Nager.Date.
 */

export interface Holiday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  global: boolean;
  counties: string[] | null;
}

/**
 * Récupère les jours fériés pour une année, un pays et affine selon le code postal (Droit Local).
 */
export async function getHolidays(year: number, countryCode: string, zipCode: string): Promise<Holiday[]> {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok) throw new Error('API Error');
    
    const holidays: Holiday[] = await response.json();
    const upCountry = countryCode.toUpperCase();

    return holidays.filter(h => {
      // 1. Toujours garder les jours fériés nationaux (global)
      if (h.global || h.counties === null) return true;

      // 2. Logique Régionale spécifique
      if (upCountry === 'FR' && zipCode.length >= 2) {
        const dept = zipCode.slice(0, 2);
        const isoRegion = `FR-${dept}`; // ex: FR-57 pour Moselle
        return h.counties.includes(isoRegion);
      }

      // 3. Luxembourg (LU) & Allemagne (DE) - On s'en tient au national pour la V1 
      // car le découpage par code postal est complexe pour ces régions.
      if (upCountry === 'LU' || upCountry === 'DE') {
        return h.global;
      }

      return false;
    });
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return [];
  }
}

/**
 * Aide : Vérifie si une date donnée est un jour férié parmi une liste.
 */
export function isHoliday(date: Date, holidays: Holiday[]): Holiday | undefined {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.find(h => h.date === dateStr);
}
