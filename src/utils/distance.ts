// Academic City / KSK Student Residence reference coordinates
export const ACADEMIC_CITY_COORDS = {
  name: "KSK Student Residence",
  area: "Academic City, Dubai",
  latitude: 25.12901,
  longitude: 55.42684,
};

/**
 * Calculates geodesic distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = ACADEMIC_CITY_COORDS.latitude,
  lon2: number = ACADEMIC_CITY_COORDS.longitude
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat1 - lat2) * Math.PI) / 180;
  const dLon = ((lon1 - lon2) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat2 * Math.PI) / 180) *
      Math.cos((lat1 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimates public transport travel time based on distance from Academic City,
 * Dubai RTA bus line connections (Bus 365, 366, X25, Metro Red Line transfers)
 */
export function estimateBusMinutes(distanceKm: number, area: string): number {
  const lowerArea = area.toLowerCase();
  
  if (lowerArea.includes('academic city')) {
    return Math.max(5, Math.round(distanceKm * 3.5));
  }
  if (lowerArea.includes('silicon oasis')) {
    return Math.max(15, Math.round(12 + distanceKm * 1.8));
  }
  if (lowerArea.includes('airport') || lowerArea.includes('rashidiya') || lowerArea.includes('garhoud')) {
    return Math.max(35, Math.round(25 + distanceKm * 1.2));
  }
  if (lowerArea.includes('downtown') || lowerArea.includes('business bay') || lowerArea.includes('difc')) {
    return Math.max(45, Math.round(30 + distanceKm * 1.1));
  }
  if (lowerArea.includes('internet city') || lowerArea.includes('media city') || lowerArea.includes('knowledge park')) {
    return Math.max(65, Math.round(40 + distanceKm * 1.15));
  }
  if (lowerArea.includes('marina') || lowerArea.includes('jlt') || lowerArea.includes('jbr')) {
    return Math.max(75, Math.round(45 + distanceKm * 1.1));
  }
  if (lowerArea.includes('abu dhabi')) {
    return Math.max(120, Math.round(60 + distanceKm * 0.8));
  }
  if (lowerArea.includes('sharjah')) {
    return Math.max(50, Math.round(35 + distanceKm * 1.2));
  }

  // General heuristic
  return Math.round(Math.max(20, 15 + distanceKm * 1.6));
}

/**
 * Estimates driving time in minutes
 */
export function estimateDrivingMinutes(distanceKm: number): number {
  if (distanceKm < 5) return 8;
  if (distanceKm < 15) return 16;
  if (distanceKm < 25) return 24;
  if (distanceKm < 35) return 32;
  if (distanceKm < 50) return 45;
  return Math.round(distanceKm * 0.9);
}

/**
 * Formats commute time string matching the UI screenshot: "~45 min (bus)" or "~1 hr 10 min (bus)"
 */
export function formatBusCommute(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} min (bus)`;
  }
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `~${hrs} hr (bus)`;
  }
  return `~${hrs} hr ${remainingMins} min (bus)`;
}

export function formatDistance(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}
