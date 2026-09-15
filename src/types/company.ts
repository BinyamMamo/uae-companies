export type Emirate = 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Other UAE';

export interface CompanyLocation {
  emirate: Emirate;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  isFreeZone: boolean;
  freeZoneName?: string | null;
}

export interface EmployeeProfile {
  id?: string;
  name: string;
  title: string;
  university?: string;
  avatarUrl?: string;
  linkedinUrl: string;
}

export interface CompanyCommute {
  distanceKm: number;
  busMinutes: number;
  drivingMinutes: number;
}

export interface Company {
  id: string;
  name: string;
  officialName?: string;
  shortDescription: string;
  whatTheyDo: string;
  industry: string;
  categories: string[];
  location: CompanyLocation;
  website: string;
  careersUrl: string;
  logo: string;
  bannerImage?: string;
  technicalAreas: string[];
  commonCareers: string[];
  internshipsKnown: boolean;
  graduateRolesKnown: boolean;
  employees: EmployeeProfile[];
  linkedinUrl: string;
  commute: CompanyCommute;
  relevanceScore: number;
  studentMatchReason?: string;
  sources: { title: string; url: string }[];
  lastUpdated: string;
}

export interface FilterState {
  search: string;
  companyTypes: string[];
  location: string;
  area: string;
  distanceMax: number | null;
  isFreeZoneOnly: boolean | null;
  careerFilter: string | null;
  sortBy: 'nearest' | 'relevance' | 'name' | 'saved';
}

export interface SavedList {
  id: string;
  name: string;
  companyIds: string[];
  createdAt: string;
}
