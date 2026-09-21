/**
 * Hand-picked Dubai landmarks used as home-location suggestions.
 *
 * These are offered before falling back to a Nominatim lookup, so the common
 * student cases (campuses, residences, metro stations) resolve instantly and
 * without a network round trip.
 */

export interface DubaiLocationPreset {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
}

export const DUBAI_LOCATIONS: DubaiLocationPreset[] = [
  { name: 'KSK Students Residence', category: 'Student Housing', latitude: 25.1292, longitude: 55.4268 },
  { name: 'University of Dubai', category: 'Campus', latitude: 25.1304, longitude: 55.4273 },
  { name: 'The Myriad Dubai', category: 'Student Housing', latitude: 25.1235, longitude: 55.4180 },
  { name: 'Uninest Student Residences', category: 'Student Housing', latitude: 25.1180, longitude: 55.3990 },
  { name: 'Academic City (DIAC Central)', category: 'Academic Hub', latitude: 25.1265, longitude: 55.4215 },
  { name: 'Zayed University Dubai', category: 'Campus', latitude: 25.1130, longitude: 55.3900 },
  { name: 'Amity University Dubai', category: 'Campus', latitude: 25.1245, longitude: 55.4220 },
  { name: 'Heriot-Watt University Dubai', category: 'Campus', latitude: 25.1110, longitude: 55.3880 },
  { name: 'BITS Pilani Dubai', category: 'Campus', latitude: 25.1280, longitude: 55.4200 },
  { name: 'University of Birmingham Dubai', category: 'Campus', latitude: 25.1250, longitude: 55.4170 },
  { name: 'Dubai Silicon Oasis (HQ)', category: 'District', latitude: 25.1238, longitude: 55.3821 },
  { name: 'DSO Cedre Community', category: 'Residential', latitude: 25.1320, longitude: 55.3875 },
  { name: 'DSO Silicon Gates', category: 'Residential', latitude: 25.1285, longitude: 55.3780 },
  { name: 'Business Bay', category: 'Business Hub', latitude: 25.1850, longitude: 55.2750 },
  { name: 'Downtown Dubai (Burj Khalifa)', category: 'District', latitude: 25.1972, longitude: 55.2744 },
  { name: 'DIFC (Financial Centre)', category: 'Financial Hub', latitude: 25.2135, longitude: 55.2810 },
  { name: 'Dubai Internet City', category: 'Tech Hub', latitude: 25.0975, longitude: 55.1624 },
  { name: 'Dubai Media City', category: 'Media Hub', latitude: 25.0950, longitude: 55.1550 },
  { name: 'Dubai Marina', category: 'District', latitude: 25.0805, longitude: 55.1403 },
  { name: 'Jumeirah Lake Towers (JLT)', category: 'District', latitude: 25.0740, longitude: 55.1420 },
  { name: 'DAFZA (Airport Freezone)', category: 'Free Zone', latitude: 25.2605, longitude: 55.3725 },
  { name: 'Mirdif City Centre', category: 'Shopping / Residential', latitude: 25.2185, longitude: 55.4180 },
  { name: 'Al Barsha 1', category: 'Residential', latitude: 25.1120, longitude: 55.2000 },
  { name: 'Deira (City Centre)', category: 'District', latitude: 25.2530, longitude: 55.3330 },
  { name: 'Bur Dubai', category: 'District', latitude: 25.2570, longitude: 55.3000 },
  { name: 'Sharjah University City', category: 'Academic Hub', latitude: 25.2950, longitude: 55.4650 },
];
