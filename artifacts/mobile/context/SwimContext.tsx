import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { AgeGroup, CourseType, Gender, StandardTimes } from '@/constants/standards';
import { AGE_GROUPS, COURSE_TYPES, get2026Times } from '@/constants/standards';
import { generateId } from '@/utils/timeUtils';

export type { AgeGroup, CourseType, Gender };

export interface VisibleStandards {
  silver: boolean;
  gold: boolean;
  zone: boolean;
}

export interface SwimmerProfile {
  name: string;
  club: string;
  usaSwimmingId: string;
  photoUri: string | null;
}

export interface TimeEntry {
  id: string;
  gender: Gender;
  ageGroup: AgeGroup;
  courseType: CourseType;
  eventId: string;
  timeHundredths: number;
  meetName: string;
  date: string;
}

interface SwimContextType {
  timeEntries: TimeEntry[];
  selectedGender: Gender;
  selectedAgeGroup: AgeGroup;
  selectedCourseType: CourseType;
  visibleStandards: VisibleStandards;
  profile: SwimmerProfile;
  isLoaded: boolean;

  setSelectedGender: (g: Gender) => void;
  setSelectedAgeGroup: (ag: AgeGroup) => void;
  setSelectedCourseType: (ct: CourseType) => void;
  setVisibleStandards: (v: VisibleStandards) => void;
  setProfile: (p: SwimmerProfile) => void;

  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  getBestTimeForEvent: (gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string) => TimeEntry | null;
  getStandardTimes: (gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string) => StandardTimes;
  getEntriesForEvent: (gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string) => TimeEntry[];
}

const SwimContext = createContext<SwimContextType | null>(null);

const KEYS = {
  timeEntries: '@swim_time_entries_v4',
  settings:    '@swim_settings_v6',
};

const DEFAULT_VISIBLE: VisibleStandards = { silver: true, gold: true, zone: true };
const DEFAULT_PROFILE: SwimmerProfile = { name: '', club: '', usaSwimmingId: '', photoUri: null };

export function SwimProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedGender, setGenderState] = useState<Gender>('F');
  const [selectedAgeGroup, setAgeGroupState] = useState<AgeGroup>('11-12');
  const [selectedCourseType, setCourseTypeState] = useState<CourseType>('LCM');
  const [visibleStandards, setVisibleState] = useState<VisibleStandards>(DEFAULT_VISIBLE);
  const [profile, setProfileState] = useState<SwimmerProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  const genderRef = useRef<Gender>('F');
  const ageGroupRef = useRef<AgeGroup>('11-12');
  const courseTypeRef = useRef<CourseType>('LCM');
  const visibleRef = useRef<VisibleStandards>(DEFAULT_VISIBLE);
  const profileRef = useRef<SwimmerProfile>(DEFAULT_PROFILE);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [te, st] = await Promise.all([
        AsyncStorage.getItem(KEYS.timeEntries),
        AsyncStorage.getItem(KEYS.settings),
      ]);
      if (te) {
        const entries = (JSON.parse(te) as Array<Record<string, unknown>>).map(e => ({
          courseType: 'LCM' as CourseType,
          meetName: '',
          ...e,
        }));
        setTimeEntries(entries as TimeEntry[]);
      }
      if (st) {
        const s = JSON.parse(st);
        if (s.selectedGender) { setGenderState(s.selectedGender); genderRef.current = s.selectedGender; }
        if (s.selectedAgeGroup && AGE_GROUPS.includes(s.selectedAgeGroup)) {
          setAgeGroupState(s.selectedAgeGroup); ageGroupRef.current = s.selectedAgeGroup;
        }
        if (s.selectedCourseType && COURSE_TYPES.includes(s.selectedCourseType)) {
          setCourseTypeState(s.selectedCourseType); courseTypeRef.current = s.selectedCourseType;
        }
        if (s.visibleStandards) {
          const v = { ...DEFAULT_VISIBLE, ...s.visibleStandards };
          setVisibleState(v); visibleRef.current = v;
        }
        if (s.profile) {
          const p = { ...DEFAULT_PROFILE, ...s.profile };
          setProfileState(p); profileRef.current = p;
        }
      }
    } catch (e) {
      console.warn('Failed to load swim data:', e);
    } finally {
      setIsLoaded(true);
    }
  }

  function persistSettings(
    gender: Gender, ageGroup: AgeGroup, courseType: CourseType,
    visible: VisibleStandards, prof: SwimmerProfile,
  ) {
    AsyncStorage.setItem(KEYS.settings, JSON.stringify({
      selectedGender: gender, selectedAgeGroup: ageGroup,
      selectedCourseType: courseType, visibleStandards: visible, profile: prof,
    }));
  }

  const setSelectedGender = useCallback((g: Gender) => {
    genderRef.current = g; setGenderState(g);
    persistSettings(g, ageGroupRef.current, courseTypeRef.current, visibleRef.current, profileRef.current);
  }, []);

  const setSelectedAgeGroup = useCallback((ag: AgeGroup) => {
    ageGroupRef.current = ag; setAgeGroupState(ag);
    persistSettings(genderRef.current, ag, courseTypeRef.current, visibleRef.current, profileRef.current);
  }, []);

  const setSelectedCourseType = useCallback((ct: CourseType) => {
    courseTypeRef.current = ct; setCourseTypeState(ct);
    persistSettings(genderRef.current, ageGroupRef.current, ct, visibleRef.current, profileRef.current);
  }, []);

  const setVisibleStandards = useCallback((v: VisibleStandards) => {
    visibleRef.current = v; setVisibleState(v);
    persistSettings(genderRef.current, ageGroupRef.current, courseTypeRef.current, v, profileRef.current);
  }, []);

  const setProfile = useCallback((p: SwimmerProfile) => {
    profileRef.current = p; setProfileState(p);
    persistSettings(genderRef.current, ageGroupRef.current, courseTypeRef.current, visibleRef.current, p);
  }, []);

  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'date'>) => {
    const e: TimeEntry = { ...entry, id: generateId(), date: new Date().toISOString() };
    setTimeEntries(prev => {
      const next = [...prev, e];
      AsyncStorage.setItem(KEYS.timeEntries, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteTimeEntry = useCallback(async (id: string) => {
    setTimeEntries(prev => {
      const next = prev.filter(e => e.id !== id);
      AsyncStorage.setItem(KEYS.timeEntries, JSON.stringify(next));
      return next;
    });
  }, []);

  const getBestTimeForEvent = useCallback((gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string): TimeEntry | null => {
    const entries = timeEntries.filter(
      e => e.gender === gender && e.ageGroup === ageGroup && e.courseType === courseType && e.eventId === eventId
    );
    if (!entries.length) return null;
    return entries.reduce((best, cur) => cur.timeHundredths < best.timeHundredths ? cur : best);
  }, [timeEntries]);

  const getStandardTimes = useCallback((gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string): StandardTimes => {
    return get2026Times(ageGroup, gender, eventId, courseType);
  }, []);

  const getEntriesForEvent = useCallback((gender: Gender, ageGroup: AgeGroup, courseType: CourseType, eventId: string): TimeEntry[] => {
    return [...timeEntries]
      .filter(e => e.gender === gender && e.ageGroup === ageGroup && e.courseType === courseType && e.eventId === eventId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [timeEntries]);

  return (
    <SwimContext.Provider value={{
      timeEntries, selectedGender, selectedAgeGroup, selectedCourseType,
      visibleStandards, profile, isLoaded,
      setSelectedGender, setSelectedAgeGroup, setSelectedCourseType,
      setVisibleStandards, setProfile,
      addTimeEntry, deleteTimeEntry,
      getBestTimeForEvent, getStandardTimes, getEntriesForEvent,
    }}>
      {children}
    </SwimContext.Provider>
  );
}

export function useSwim() {
  const ctx = useContext(SwimContext);
  if (!ctx) throw new Error('useSwim must be used within SwimProvider');
  return ctx;
}
