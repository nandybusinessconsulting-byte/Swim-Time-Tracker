import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { AgeGroup, Gender, StandardTimes } from '@/constants/standards';
import { AGE_GROUPS, get2026Times } from '@/constants/standards';
import { generateId } from '@/utils/timeUtils';

export type { AgeGroup, Gender };

export interface TimeEntry {
  id: string;
  gender: Gender;
  ageGroup: AgeGroup;
  eventId: string;
  timeHundredths: number;
  date: string;
}

interface SwimContextType {
  timeEntries: TimeEntry[];
  selectedGender: Gender;
  selectedAgeGroup: AgeGroup;
  isLoaded: boolean;

  setSelectedGender: (g: Gender) => void;
  setSelectedAgeGroup: (ag: AgeGroup) => void;

  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  getBestTimeForEvent: (gender: Gender, ageGroup: AgeGroup, eventId: string) => TimeEntry | null;
  getStandardTimes: (gender: Gender, ageGroup: AgeGroup, eventId: string) => StandardTimes;
}

const SwimContext = createContext<SwimContextType | null>(null);

const KEYS = {
  timeEntries: '@swim_time_entries_v3',
  settings:    '@swim_settings_v4',
};

export function SwimProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedGender, setGenderState] = useState<Gender>('F');
  const [selectedAgeGroup, setAgeGroupState] = useState<AgeGroup>('11-12');
  const [isLoaded, setIsLoaded] = useState(false);

  const genderRef = useRef<Gender>('F');
  const ageGroupRef = useRef<AgeGroup>('11-12');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [te, st] = await Promise.all([
        AsyncStorage.getItem(KEYS.timeEntries),
        AsyncStorage.getItem(KEYS.settings),
      ]);
      if (te) setTimeEntries(JSON.parse(te));
      if (st) {
        const s = JSON.parse(st);
        if (s.selectedGender) {
          setGenderState(s.selectedGender);
          genderRef.current = s.selectedGender;
        }
        if (s.selectedAgeGroup && AGE_GROUPS.includes(s.selectedAgeGroup)) {
          setAgeGroupState(s.selectedAgeGroup);
          ageGroupRef.current = s.selectedAgeGroup;
        }
      }
    } catch (e) {
      console.warn('Failed to load swim data:', e);
    } finally {
      setIsLoaded(true);
    }
  }

  async function persistSettings(gender: Gender, ageGroup: AgeGroup) {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify({ selectedGender: gender, selectedAgeGroup: ageGroup }));
  }

  const setSelectedGender = useCallback((g: Gender) => {
    genderRef.current = g;
    setGenderState(g);
    persistSettings(g, ageGroupRef.current);
  }, []);

  const setSelectedAgeGroup = useCallback((ag: AgeGroup) => {
    ageGroupRef.current = ag;
    setAgeGroupState(ag);
    persistSettings(genderRef.current, ag);
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

  const getBestTimeForEvent = useCallback((gender: Gender, ageGroup: AgeGroup, eventId: string): TimeEntry | null => {
    const entries = timeEntries.filter(
      e => e.gender === gender && e.ageGroup === ageGroup && e.eventId === eventId
    );
    if (!entries.length) return null;
    return entries.reduce((best, cur) => cur.timeHundredths < best.timeHundredths ? cur : best);
  }, [timeEntries]);

  const getStandardTimes = useCallback((gender: Gender, ageGroup: AgeGroup, eventId: string): StandardTimes => {
    return get2026Times(ageGroup, gender, eventId);
  }, []);

  return (
    <SwimContext.Provider value={{
      timeEntries,
      selectedGender, selectedAgeGroup,
      isLoaded,
      setSelectedGender, setSelectedAgeGroup,
      addTimeEntry, deleteTimeEntry,
      getBestTimeForEvent, getStandardTimes,
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
