import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Company, FilterState, SavedList } from '../types/company';
import { loadCompanies } from '../data/loadCompanies';
import { DEFAULT_STUDENT_INTERESTS } from '../utils/relevance';
import { ACADEMIC_CITY_COORDS, calculateDistanceKm, estimateBusMinutes, estimateDrivingMinutes } from '../utils/distance';
import { readJSON, writeJSON, readString, writeString, isStringArray } from '../utils/storage';
import { track, trackView } from '../lib/analytics';
import { useTheme } from './ThemeContext';
import { useProfileSync } from '../hooks/useProfileSync';
import type { SyncedProfile } from '../lib/sync';

const isSavedListArray = (v: unknown): v is SavedList[] =>
  Array.isArray(v) &&
  v.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as SavedList).id === 'string' &&
      typeof (item as SavedList).name === 'string' &&
      isStringArray((item as SavedList).companyIds)
  );

const isUserLocation = (v: unknown): v is UserLocation =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as UserLocation).name === 'string' &&
  Number.isFinite((v as UserLocation).latitude) &&
  Number.isFinite((v as UserLocation).longitude);

export interface UserLocation {
  name: string;
  latitude: number;
  longitude: number;
  isCustom?: boolean;
}

interface AppContextType {
  companies: Company[];
  /** 'loading' until the fetched dataset arrives; views show skeletons meanwhile. */
  companiesStatus: 'loading' | 'ready' | 'error';
  reloadCompanies: () => void;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  activeTab: 'list' | 'featured' | 'map' | 'saved';
  setActiveTab: (tab: 'list' | 'featured' | 'map' | 'saved') => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  clearFilters: () => void;
  savedCompanyIds: string[];
  toggleSaveCompany: (id: string) => void;
  isCompanySaved: (id: string) => boolean;
  savedLists: SavedList[];
  createSavedList: (name: string) => void;
  deleteSavedList: (id: string) => void;
  renameSavedList: (id: string, newName: string) => void;
  addCompanyToList: (listId: string, companyId: string) => void;
  removeCompanyFromList: (listId: string, companyId: string) => void;
  activeListId: string;
  setActiveListId: (id: string) => void;
  userInterests: string[];
  setUserInterests: React.Dispatch<React.SetStateAction<string[]>>;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  resetInterests: () => void;
  username: string;
  setUsername: (name: string) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  compareCompanyIds: string[];
  toggleCompareCompany: (id: string) => void;
  isCompanyInCompare: (id: string) => boolean;
  clearCompare: () => void;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (open: boolean) => void;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;
  filteredCompanies: Company[];
  userLocation: UserLocation;
  setUserLocation: (loc: UserLocation) => void;
  resetUserLocation: () => void;
}

const initialFilters: FilterState = {
  search: '',
  companyTypes: [],
  location: 'All locations',
  area: 'All areas',
  distanceMax: null,
  busMinutesMax: null,
  isFreeZoneOnly: null,
  careerFilter: null,
  hasCareersUrl: false,
  verifiedOnly: false,
  sortBy: 'nearest',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read-only here: the profile sync mirrors these, it does not own them.
  const { theme, accentColor } = useTheme();
  const [activeTab, setActiveTabState] = useState<'list' | 'featured' | 'map' | 'saved'>('list');

  const setActiveTab = useCallback((tab: 'list' | 'featured' | 'map' | 'saved') => {
    setActiveTabState(prev => {
      if (prev !== tab) {
        trackView(tab);
        track('view_changed', { view: tab });
      }
      return tab;
    });
  }, []);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);

  const setSelectedCompany = useCallback((company: Company | null) => {
    if (company) track('company_opened', { company_id: company.id, surface: 'card' });
    setSelectedCompanyState(company);
  }, []);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [userInterests, setUserInterests] = useState<string[]>(() => {
    return readJSON('uae_user_interests', isStringArray) ?? DEFAULT_STUDENT_INTERESTS;
  });

  useEffect(() => {
    writeJSON('uae_user_interests', userInterests);
  }, [userInterests]);

  const addInterest = useCallback((interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;
    setUserInterests(prev => {
      if (prev.some(i => i.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
  }, []);

  const removeInterest = useCallback((interest: string) => {
    setUserInterests(prev => prev.filter(i => i.toLowerCase() !== interest.toLowerCase()));
  }, []);

  const resetInterests = useCallback(() => {
    setUserInterests(DEFAULT_STUDENT_INTERESTS);
  }, []);

  const [username, setUsernameState] = useState<string>(() => {
    try {
      return readString('uae_username') ?? '';
    } catch {
      return '';
    }
  });

  const setUsername = useCallback((name: string) => {
    setUsernameState(name);
    try {
      writeString('uae_username', name);
    } catch {
      // ignore
    }
  }, []);

  const [compareCompanyIds, setCompareCompanyIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // User location for commute / distance calculations with localStorage persistence
  const [userLocation, setUserLocationState] = useState<UserLocation>(() => {
    const stored = readJSON('uae_user_location', isUserLocation);
    if (stored) return stored;
    return {
      name: ACADEMIC_CITY_COORDS.name,
      latitude: ACADEMIC_CITY_COORDS.latitude,
      longitude: ACADEMIC_CITY_COORDS.longitude,
      isCustom: false,
    };
  });

  const setUserLocation = useCallback((loc: UserLocation) => {
    setUserLocationState(loc);
    try {
      writeJSON('uae_user_location', loc);
      track('home_location_changed', { method: loc.isCustom ? 'map' : 'reset' });
    } catch {
      // ignore
    }
  }, []);

  const resetUserLocation = useCallback(() => {
    const defLoc: UserLocation = {
      name: ACADEMIC_CITY_COORDS.name,
      latitude: ACADEMIC_CITY_COORDS.latitude,
      longitude: ACADEMIC_CITY_COORDS.longitude,
      isCustom: false,
    };
    setUserLocationState(defLoc);
    try {
      localStorage.removeItem('uae_user_location');
    } catch {
      // ignore
    }
  }, []);

  // Company data is fetched rather than bundled; see data/loadCompanies.ts.
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [companiesStatus, setCompaniesStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setCompaniesStatus('loading');
    loadCompanies()
      .then(data => {
        if (cancelled) return;
        setAllCompanies(data);
        setCompaniesStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setCompaniesStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reloadCompanies = useCallback(() => {
    setCompaniesStatus('loading');
    loadCompanies()
      .then(data => {
        setAllCompanies(data);
        setCompaniesStatus('ready');
      })
      .catch(() => setCompaniesStatus('error'));
  }, []);

  // Recompute commute figures whenever the user's home location moves.
  const companies = useMemo(() => {
    if (
      !userLocation.isCustom &&
      userLocation.latitude === ACADEMIC_CITY_COORDS.latitude &&
      userLocation.longitude === ACADEMIC_CITY_COORDS.longitude
    ) {
      return allCompanies;
    }
    return allCompanies.map(company => {
      const distanceKm = calculateDistanceKm(
        company.location.latitude,
        company.location.longitude,
        userLocation.latitude,
        userLocation.longitude
      );
      const busMinutes = estimateBusMinutes(distanceKm, company.location.area);
      const drivingMinutes = estimateDrivingMinutes(distanceKm);
      return {
        ...company,
        commute: {
          distanceKm,
          busMinutes,
          drivingMinutes,
        },
      };
    });
  }, [allCompanies, userLocation]);

  /*
    New users start empty. This previously seeded 8 pre-saved companies and 3
    pre-made lists "matching screenshot", so a first-time visitor was shown
    bookmarks they had never made.
  */
  const [savedCompanyIds, setSavedCompanyIds] = useState<string[]>(
    () => readJSON('uae_saved_companies', isStringArray) ?? []
  );

  const [savedLists, setSavedLists] = useState<SavedList[]>(
    () =>
      readJSON('uae_saved_lists', isSavedListArray) ?? [
        {
          id: 'default',
          name: 'All Saved',
          companyIds: [],
          createdAt: new Date().toISOString(),
        },
      ]
  );

  const [activeListId, setActiveListId] = useState<string>('default');

  // Check URL parameters on mount for shared list
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedName = params.get('share_name');
      const sharedIds = params.get('share_ids');
      if (sharedName && sharedIds) {
        const ids = sharedIds.split(',').filter(Boolean);
        const newListId = 'shared-' + Date.now();
        setSavedLists(prev => [
          ...prev,
          {
            id: newListId,
            name: decodeURIComponent(sharedName),
            companyIds: ids,
            createdAt: new Date().toISOString()
          }
        ]);
        setActiveListId(newListId);
        setActiveTab('saved');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      writeJSON('uae_saved_companies', savedCompanyIds);
    } catch {
      // ignore
    }
  }, [savedCompanyIds]);

  useEffect(() => {
    try {
      writeJSON('uae_saved_lists', savedLists);
    } catch {
      // ignore
    }
  }, [savedLists]);

  const toggleSaveCompany = useCallback((id: string) => {
    setSavedCompanyIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(cId => cId !== id) : [...prev, id];
      track('company_saved', { company_id: id, saved: !isSaved });
      
      // Update default list
      setSavedLists(lists => lists.map(list => {
        if (list.id === 'default') {
          return { ...list, companyIds: updated };
        }
        if (isSaved) {
          return { ...list, companyIds: list.companyIds.filter(cId => cId !== id) };
        }
        return list;
      }));

      return updated;
    });
  }, []);

  const isCompanySaved = useCallback((id: string) => savedCompanyIds.includes(id), [savedCompanyIds]);

  const createSavedList = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newList: SavedList = {
      id: 'list-' + Date.now(),
      name: trimmed,
      companyIds: [],
      createdAt: new Date().toISOString()
    };
    setSavedLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
    track('list_created');
  }, []);

  const deleteSavedList = useCallback((id: string) => {
    if (id === 'default') return; // Cannot delete default
    setSavedLists(prev => prev.filter(l => l.id !== id));
    // Functional form, so this reads the current id rather than one captured
    // when the callback was created.
    setActiveListId(current => (current === id ? 'default' : current));
    track('list_deleted');
  }, []);

  const renameSavedList = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavedLists(prev => prev.map(l => l.id === id ? { ...l, name: trimmed } : l));
  }, []);

  const addCompanyToList = useCallback((listId: string, companyId: string) => {
    setSavedLists(prev => prev.map(l => {
      if (l.id === listId && !l.companyIds.includes(companyId)) {
        return { ...l, companyIds: [...l.companyIds, companyId] };
      }
      return l;
    }));
    setSavedCompanyIds(prev => (prev.includes(companyId) ? prev : [...prev, companyId]));
  }, []);

  const removeCompanyFromList = useCallback((listId: string, companyId: string) => {
    setSavedLists(prev => prev.map(l => {
      if (l.id === listId) {
        return { ...l, companyIds: l.companyIds.filter(id => id !== companyId) };
      }
      return l;
    }));
  }, []);

  const toggleCompareCompany = useCallback((id: string) => {
    setCompareCompanyIds(prev => {
      if (prev.includes(id)) {
        track('compare_toggled', { company_id: id, added: false });
        return prev.filter(cId => cId !== id);
      }
      track('compare_toggled', { company_id: id, added: true });
      if (prev.length >= 4) {
        return [...prev.slice(1), id]; // Max 4 companies
      }
      return [...prev, id];
    });
  }, []);

  const isCompanyInCompare = useCallback((id: string) => compareCompanyIds.includes(id), [compareCompanyIds]);

  const clearCompare = useCallback(() => setCompareCompanyIds([]), []);

  const clearFilters = useCallback(() => {
    track('filters_cleared');
    setFilters(initialFilters);
  }, []);

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = company.name.toLowerCase().includes(query);
        const matchesCat = company.categories.some(c => c.toLowerCase().includes(query));
        const matchesLoc = company.location.area.toLowerCase().includes(query) || company.location.emirate.toLowerCase().includes(query);
        const matchesDesc = (company.shortDescription ?? '').toLowerCase().includes(query);
        const matchesCareer = company.commonCareers.some(r => r.toLowerCase().includes(query));
        const matchesTech = company.technicalAreas.some(t => t.toLowerCase().includes(query));
        if (!matchesName && !matchesCat && !matchesLoc && !matchesDesc && !matchesCareer && !matchesTech) {
          return false;
        }
      }

      // Company Type
      if (filters.companyTypes.length > 0) {
        const hasMatchingType = filters.companyTypes.some(type => {
          if (type === 'Tech / Software') {
            return company.categories.includes('Tech / Software') || company.categories.includes('Software') || (company.industry ?? '').includes('Technology');
          }
          if (type === 'AI / Data') {
            return company.categories.includes('AI/ML') || company.categories.includes('AI / ML') || company.categories.includes('Data');
          }
          if (type === 'Cybersecurity') {
            return company.categories.includes('Cybersecurity') || company.technicalAreas.includes('Cybersecurity');
          }
          if (type === 'Hardware / Embedded') {
            return company.categories.includes('Hardware / Embedded') || company.categories.includes('Hardware') || company.categories.includes('Embedded');
          }
          if (type === 'Telecom / Networks') {
            return company.categories.includes('Telecom / Networks') || company.categories.includes('Telecom');
          }
          if (type === 'Aviation') {
            return company.categories.includes('Aviation') || (company.industry ?? '').includes('Aviation');
          }
          if (type === 'Other') {
            return !['Tech / Software', 'AI/ML', 'Cybersecurity', 'Hardware / Embedded', 'Telecom / Networks', 'Aviation'].some(t => company.categories.includes(t));
          }
          return company.categories.includes(type);
        });
        if (!hasMatchingType) return false;
      }

      // Location
      if (filters.location !== 'All locations') {
        if (company.location.emirate !== filters.location) return false;
      }

      // Area
      if (filters.area !== 'All areas') {
        if (!company.location.area.toLowerCase().includes(filters.area.toLowerCase())) return false;
      }

      // Distance
      if (filters.distanceMax !== null) {
        if (company.commute.distanceKm > filters.distanceMax) return false;
      }

      // Free Zone
      if (filters.isFreeZoneOnly !== null) {
        if (company.location.isFreeZone !== filters.isFreeZoneOnly) return false;
      }

      // Max bus commute, in minutes
      if (filters.busMinutesMax !== null) {
        if (company.commute.busMinutes >= filters.busMinutesMax) return false;
      }

      // Only companies with a careers page we actually found
      if (filters.hasCareersUrl && !company.careersUrl) return false;

      // Only companies whose details are backed by a source
      if (filters.verifiedOnly && !company.shortDescription) return false;

      // Specific career role filter
      if (filters.careerFilter) {
        const norm = filters.careerFilter.toLowerCase();
        if (!company.commonCareers.some(c => c.toLowerCase().includes(norm))) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'nearest') {
        return a.commute.distanceKm - b.commute.distanceKm;
      }
      if (filters.sortBy === 'relevance') {
        return b.relevanceScore - a.relevanceScore;
      }
      if (filters.sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (filters.sortBy === 'saved') {
        const aSaved = savedCompanyIds.includes(a.id) ? 1 : 0;
        const bSaved = savedCompanyIds.includes(b.id) ? 1 : 0;
        if (bSaved !== aSaved) return bSaved - aSaved;
        return a.commute.distanceKm - b.commute.distanceKm;
      }
      return 0;
    });
  }, [companies, filters, savedCompanyIds]);

  /*
    Cross-device sync for signed-in users. Local state stays authoritative;
    this mirrors it to Firestore and merges anything found there on sign-in.
    With Firebase unconfigured, useProfileSync is a no-op.
  */
  const syncProfile = useMemo<SyncedProfile>(
    () => ({
      savedCompanyIds,
      savedLists,
      userInterests,
      userLocation,
      accentColor,
      theme,
    }),
    [savedCompanyIds, savedLists, userInterests, userLocation, accentColor, theme]
  );

  const handleMergedProfile = useCallback((merged: SyncedProfile) => {
    setSavedCompanyIds(merged.savedCompanyIds);
    setSavedLists(merged.savedLists);
    if (merged.userInterests.length) setUserInterests(merged.userInterests);
  }, []);

  useProfileSync({ profile: syncProfile, onMerged: handleMergedProfile });

  const value = useMemo<AppContextType>(
    () => ({
      companies,
      companiesStatus,
      reloadCompanies,
      selectedCompany,
      setSelectedCompany,
      activeTab,
      setActiveTab,
      filters,
      setFilters,
      clearFilters,
      savedCompanyIds,
      toggleSaveCompany,
      isCompanySaved,
      savedLists,
      createSavedList,
      deleteSavedList,
      renameSavedList,
      addCompanyToList,
      removeCompanyFromList,
      activeListId,
      setActiveListId,
      userInterests,
      setUserInterests,
      addInterest,
      removeInterest,
      resetInterests,
      username,
      setUsername,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      compareCompanyIds,
      toggleCompareCompany,
      isCompanyInCompare,
      clearCompare,
      isCompareModalOpen,
      setIsCompareModalOpen,
      isMobileFilterOpen,
      setIsMobileFilterOpen,
      filteredCompanies,
      userLocation,
      setUserLocation,
      resetUserLocation,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeListId,
      activeTab,
      addCompanyToList,
      addInterest,
      clearCompare,
      clearFilters,
      companies,
      companiesStatus,
      compareCompanyIds,
      createSavedList,
      deleteSavedList,
      filteredCompanies,
      filters,
      isCompanyInCompare,
      isCompanySaved,
      isCompareModalOpen,
      isMobileFilterOpen,
      isSettingsModalOpen,
      removeCompanyFromList,
      reloadCompanies,
      removeInterest,
      renameSavedList,
      resetInterests,
      resetUserLocation,
      savedCompanyIds,
      savedLists,
      selectedCompany,
      setActiveListId,
      setActiveTab,
      setFilters,
      setIsCompareModalOpen,
      setIsMobileFilterOpen,
      setIsSettingsModalOpen,
      setSelectedCompany,
      setUserInterests,
      setUserLocation,
      setUsername,
      toggleCompareCompany,
      toggleSaveCompany,
      userInterests,
      userLocation,
      username,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
