export type StreetEventType = 'TRAVAUX' | 'FÊTE' | 'BROCANTE';

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface StreetAlert {
  id: string;
  type: StreetEventType;
  location: GeoLocation;
  title: string;
}

export interface ImpactResult {
  distanceMeters: number;
  impactText: string;
  impactValue: number; // Pourcentage positif ou négatif
  color: string;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceMeters(loc1: GeoLocation, loc2: GeoLocation): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = deg2rad(loc2.lat - loc1.lat);
  const dLon = deg2rad(loc2.lng - loc1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(loc1.lat)) * Math.cos(deg2rad(loc2.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  
  return distanceKm * 1000;
}

export function calculateImpact(eventLocation: GeoLocation, shopLocation: GeoLocation, eventType: StreetEventType): ImpactResult | null {
  const distance = getDistanceMeters(eventLocation, shopLocation);

  // Si l'événement est trop loin de la zone d'influence, aucun impact spécifique
  if (distance > 2000) return null;

  if (eventType === 'TRAVAUX' && distance < 100) {
    return {
      distanceMeters: Math.round(distance),
      impactText: "Baisse importante du flux piéton attendue.",
      impactValue: -40,
      color: 'text-fefo-DEFAULT border-fefo-DEFAULT/30 bg-fefo-DEFAULT/10' // Rouge Ruby
    };
  }

  if (eventType === 'FÊTE' && distance < 1000) {
    return {
      distanceMeters: Math.round(distance),
      impactText: "Forte affluence. Opportunité pour le snacking !",
      impactValue: 25,
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' // Bleu Fête
    };
  }

  if (eventType === 'BROCANTE' && distance < 500) {
    return {
      distanceMeters: Math.round(distance),
      impactText: "Hausse du passage curieux devant la boutique.",
      impactValue: 15,
      color: 'text-action-light border-action-DEFAULT/30 bg-action-DEFAULT/10' // Cyan
    };
  }

  // Fallback générique
  return {
    distanceMeters: Math.round(distance),
    impactText: "Impact mineur sur la fréquentation.",
    impactValue: 0,
    color: 'text-inox-muted border-inox-700 bg-inox-800'
  };
}

export interface ShopInfo {
  location: GeoLocation;
  cityName: string;
  street?: string; // optionnel, non vérifié par API
}

const STORAGE_KEY = 'cambuse_shop_location';

export function saveShopInfo(info: ShopInfo): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
}

export function loadShopInfo(): ShopInfo | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    // Compat rétro: si l'ancien format (GeoLocation seul) est stocké
    if (!parsed.location && parsed.lat !== undefined) {
      return { location: { lat: parsed.lat, lng: parsed.lng }, cityName: 'Ma Boutique' };
    }
    return parsed as ShopInfo;
  } catch (e) {
    return null;
  }
}

/** @deprecated Utiliser saveShopInfo */
export function saveShopLocation(location: GeoLocation): void {
  saveShopInfo({ location, cityName: 'Ma Boutique' });
}

/** @deprecated Utiliser loadShopInfo */
export function loadShopLocation(): GeoLocation | null {
  return loadShopInfo()?.location ?? null;
}
