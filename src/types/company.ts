export type Emirate = 'Dubai' | 'Abu Dhabi' | 'Sharjah' | 'Other UAE';

/**
 * How much we actually know about a field.
 *
 *  verified   - checked against a named third-party source, and links resolve
 *  reported   - stated by the company itself (their own site / LinkedIn)
 *  estimated  - derived by us (e.g. commute times computed from coordinates)
 *  unverified - carried over from the original seed data, not yet checked
 *
 * The UI must not present `unverified` values as facts.
 */
export type Confidence = 'verified' | 'reported' | 'estimated' | 'unverified';

export interface Provenance {
  /** Where the value came from. Null when nothing backs it up. */
  sourceUrl: string | null;
  /** ISO date the value was last confirmed. */
  retrievedAt: string | null;
  confidence: Confidence;
}

export interface CompanyLocation {
  emirate: Emirate;
  area: string;
  /** Null when no real street address is known — never a generated placeholder. */
  address: string | null;
  latitude: number;
  longitude: number;
  isFreeZone: boolean;
  freeZoneName?: string | null;
  /** 'building' when the point is the actual office; 'area' when it is a district centroid. */
  precision: 'building' | 'area';
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

export interface CompanySource {
  title: string;
  url: string;
  /** False for the company's own site — that is a claim, not a citation. */
  thirdParty: boolean;
}

export interface Company {
  id: string;
  name: string;
  officialName?: string;
  /** Null when we have no researched description rather than a templated one. */
  shortDescription: string | null;
  whatTheyDo: string | null;
  industry: string | null;
  categories: string[];
  location: CompanyLocation;
  /** Null when no working website is known. */
  website: string | null;
  /** Null unless a real careers page was found — never website + "/careers". */
  careersUrl: string | null;
  /** Null falls back to a monogram tile rather than a generated avatar. */
  logo: string | null;
  bannerImage?: string | null;
  technicalAreas: string[];
  commonCareers: string[];
  /** Null means "we don't know", which is different from false. */
  internshipsKnown: boolean | null;
  graduateRolesKnown: boolean | null;
  /** Named programmes found on the company's careers page, e.g. "Emirati Graduate Programme". */
  programmes: { name: string; kind: 'internship' | 'graduate' }[];
  employees: EmployeeProfile[];
  linkedinUrl: string | null;
  commute: CompanyCommute;
  relevanceScore: number;
  studentMatchReason?: string | null;
  sources: CompanySource[];
  /** ISO date this record was last checked, per record — not a global stamp. */
  lastUpdated: string | null;
  /** Per-field provenance for the claims a user might act on. */
  provenance: {
    website: Provenance;
    careersUrl: Provenance;
    location: Provenance;
    description: Provenance;
    programmes: Provenance;
    linkedinUrl: Provenance;
  };
}

export interface FilterState {
  search: string;
  companyTypes: string[];
  location: string;
  area: string;
  distanceMax: number | null;
  isFreeZoneOnly: boolean | null;
  careerFilter: string | null;
  /** Only companies whose careers page we actually found. */
  hasCareersUrl: boolean;
  /** Only companies whose details are backed by a source. */
  verifiedOnly: boolean;
  sortBy: 'nearest' | 'relevance' | 'name' | 'saved';
}

export interface SavedList {
  id: string;
  name: string;
  companyIds: string[];
  createdAt: string;
}

/** True when enough of a record is backed by a source to show it without a caveat. */
export const isWellSourced = (c: Company): boolean =>
  c.provenance.website.confidence !== 'unverified' &&
  c.provenance.description.confidence !== 'unverified';
