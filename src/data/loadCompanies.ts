import type { Company } from '../types/company';

/**
 * Companies are fetched at runtime rather than imported.
 *
 * The dataset is ~300KB; importing it put all of that in the initial JS bundle
 * and blocked first paint even on views that never show a company. Fetching it
 * lets the shell render immediately and the list fill in behind a skeleton.
 */

let cache: Promise<Company[]> | null = null;

export function loadCompanies(): Promise<Company[]> {
  cache ??= fetch(`${import.meta.env.BASE_URL}data/companies.json`)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load companies (HTTP ${res.status})`);
      return res.json() as Promise<unknown>;
    })
    .then(data => {
      if (!Array.isArray(data)) throw new Error('Company data is malformed');
      return data as Company[];
    })
    .catch(err => {
      // Let the next attempt retry rather than caching the failure forever.
      cache = null;
      throw err;
    });

  return cache;
}
