import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { Company, FilterState, SavedList } from '../types/company';
import { AUTHORITATIVE_COMPANIES } from '../data/authoritativeCompanies';
import { DEFAULT_STUDENT_INTERESTS } from '../utils/relevance';
import { ACADEMIC_CITY_COORDS, calculateDistanceKm, estimateBusMinutes, estimateDrivingMinutes } from '../utils/distance';
import { applyAccentTheme } from '../utils/accentThemes';

export interface UserLocation {
  name: string;
  latitude: number;
  longitude: number;
  isCustom?: boolean;
}

interface AppContextType {
  companies: Company[];
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  activeTab: 'list' | 'browse' | 'featured' | 'map' | 'saved';
  setActiveTab: (tab: 'list' | 'browse' | 'featured' | 'map' | 'saved') => void;
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
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
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
  isFreeZoneOnly: null,
  careerFilter: null,
  sortBy: 'nearest',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'browse' | 'featured' | 'map' | 'saved'>('list');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [userInterests, setUserInterests] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('uae_user_interests');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEFAULT_STUDENT_INTERESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('uae_user_interests', JSON.stringify(userInterests));
    } catch {
      // ignore
    }
  }, [userInterests]);

  const addInterest = (interest: string) => {
    const trimmed = interest.trim();
    if (!trimmed) return;
    setUserInterests(prev => {
      if (prev.some(i => i.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, trimmed];
    });
  };

  const removeInterest = (interest: string) => {
    setUserInterests(prev => prev.filter(i => i.toLowerCase() !== interest.toLowerCase()));
  };

  const resetInterests = () => {
    setUserInterests(DEFAULT_STUDENT_INTERESTS);
  };

  const [username, setUsernameState] = useState<string>(() => {
    try {
      return localStorage.getItem('uae_username') || '';
    } catch {
      return '';
    }
  });

  const setUsername = (name: string) => {
    setUsernameState(name);
    try {
      localStorage.setItem('uae_username', name);
    } catch {
      // ignore
    }
  };

  const [compareCompanyIds, setCompareCompanyIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Dark mode state with localStorage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = localStorage.getItem('uae_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('uae_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Accent color state with CSS variable application and localStorage persistence
  const [accentColor, setAccentColorState] = useState<string>(() => {
    try {
      return localStorage.getItem('uae_accent_color') || 'blue';
    } catch {
      return 'blue';
    }
  });

  useEffect(() => {
    applyAccentTheme(accentColor);
  }, [accentColor]);

  const setAccentColor = (accentId: string) => {
    setAccentColorState(accentId);
    try {
      localStorage.setItem('uae_accent_color', accentId);
    } catch {
      // ignore
    }
    applyAccentTheme(accentId);
  };

  // User location for commute / distance calculations with localStorage persistence
  const [userLocation, setUserLocationState] = useState<UserLocation>(() => {
    try {
      const stored = localStorage.getItem('uae_user_location');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      name: ACADEMIC_CITY_COORDS.name,
      latitude: ACADEMIC_CITY_COORDS.latitude,
      longitude: ACADEMIC_CITY_COORDS.longitude,
      isCustom: false,
    };
  });

  const setUserLocation = (loc: UserLocation) => {
    setUserLocationState(loc);
    try {
      localStorage.setItem('uae_user_location', JSON.stringify(loc));
    } catch {
      // ignore
    }
  };

  const resetUserLocation = () => {
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
  };

  // Dynamically compute companies commute data based on userLocation
  const companies = useMemo(() => {
    if (
      !userLocation.isCustom &&
      userLocation.latitude === ACADEMIC_CITY_COORDS.latitude &&
      userLocation.longitude === ACADEMIC_CITY_COORDS.longitude
    ) {
      return AUTHORITATIVE_COMPANIES;
    }
    return AUTHORITATIVE_COMPANIES.map(company => {
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
  }, [userLocation]);

  // Saved companies state persisted to localStorage
  const [savedCompanyIds, setSavedCompanyIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('uae_saved_companies');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    // Default seed saved companies matching screenshot
    return ['microsoft', 'bayut', 'kitopi', 'sap', 'ericsson', 'motorola-solutions', 'amazon-web-services', 'help-ag'];
  });

  const [savedLists, setSavedLists] = useState<SavedList[]>(() => {
    try {
      const stored = localStorage.getItem('uae_saved_lists');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [
      {
        id: 'default',
        name: 'All Saved',
        companyIds: ['microsoft', 'bayut', 'kitopi', 'sap', 'ericsson', 'motorola-solutions', 'amazon-web-services', 'help-ag'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'ai-shortlist',
        name: 'AI & Data Shortlist',
        companyIds: ['microsoft', 'bayut', 'kitopi'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'near-academic-city',
        name: 'Near Academic City',
        companyIds: ['kitopi', 'gatex-innovations', 'ezelink'],
        createdAt: new Date().toISOString()
      }
    ];
  });

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
      localStorage.setItem('uae_saved_companies', JSON.stringify(savedCompanyIds));
    } catch {
      // ignore
    }
  }, [savedCompanyIds]);

  useEffect(() => {
    try {
      localStorage.setItem('uae_saved_lists', JSON.stringify(savedLists));
    } catch {
      // ignore
    }
  }, [savedLists]);

  const toggleSaveCompany = (id: string) => {
    setSavedCompanyIds(prev => {
      const isSaved = prev.includes(id);
      const updated = isSaved ? prev.filter(cId => cId !== id) : [...prev, id];
      
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
  };

  const isCompanySaved = (id: string) => savedCompanyIds.includes(id);

  const createSavedList = (name: string) => {
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
  };

  const deleteSavedList = (id: string) => {
    if (id === 'default') return; // Cannot delete default
    setSavedLists(prev => prev.filter(l => l.id !== id));
    if (activeListId === id) {
      setActiveListId('default');
    }
  };

  const renameSavedList = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavedLists(prev => prev.map(l => l.id === id ? { ...l, name: trimmed } : l));
  };

  const addCompanyToList = (listId: string, companyId: string) => {
    setSavedLists(prev => prev.map(l => {
      if (l.id === listId && !l.companyIds.includes(companyId)) {
        return { ...l, companyIds: [...l.companyIds, companyId] };
      }
      return l;
    }));
    if (!savedCompanyIds.includes(companyId)) {
      setSavedCompanyIds(prev => [...prev, companyId]);
    }
  };

  const removeCompanyFromList = (listId: string, companyId: string) => {
    setSavedLists(prev => prev.map(l => {
      if (l.id === listId) {
        return { ...l, companyIds: l.companyIds.filter(id => id !== companyId) };
      }
      return l;
    }));
  };

  const toggleCompareCompany = (id: string) => {
    setCompareCompanyIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), id]; // Max 4 companies
      }
      return [...prev, id];
    });
  };

  const isCompanyInCompare = (id: string) => compareCompanyIds.includes(id);

  const clearCompare = () => setCompareCompanyIds([]);

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = company.name.toLowerCase().includes(query);
        const matchesCat = company.categories.some(c => c.toLowerCase().includes(query));
        const matchesLoc = company.location.area.toLowerCase().includes(query) || company.location.emirate.toLowerCase().includes(query);
        const matchesDesc = company.shortDescription.toLowerCase().includes(query);
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
            return company.categories.includes('Tech / Software') || company.categories.includes('Software') || company.industry.includes('Technology');
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
            return company.categories.includes('Aviation') || company.industry.includes('Aviation');
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

  return (
    <AppContext.Provider
      value={{
        companies,
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
        theme,
        toggleTheme,
        accentColor,
        setAccentColor,
        userLocation,
        setUserLocation,
        resetUserLocation,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
