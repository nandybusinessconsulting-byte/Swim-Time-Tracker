import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import type { AgeGroup, Gender, StandardTimes } from '@/constants/standards';
import { AGE_GROUPS, get2026Times } from '@/constants/standards';
import { generateId } from '@/utils/timeUtils';

export type { AgeGroup, Gender };

export interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
}

export interface TimeEntry {
  id: string;
  gender: Gender;
  ageGroup: AgeGroup;
  meetId: string;
  eventId: string;
  timeHundredths: number;
  date: string;
}

interface SwimContextType {
  meets: Meet[];
  timeEntries: TimeEntry[];
  selectedGender: Gender;
  selectedAgeGroup: AgeGroup;
  isLoaded: boolean;

  setSelectedGender: (g: Gender) => void;
  setSelectedAgeGroup: (ag: AgeGroup) => void;

  addMeet: (meet: Omit<Meet, 'id'>) => Promise<Meet>;
  deleteMeet: (id: string) => Promise<void>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  getBestTimeForEvent: (gender: Gender, ageGroup: AgeGroup, eventId: string) => TimeEntry | null;
  getStandardTimes: (gender: Gender, ageGroup: AgeGroup, eventId: string) => StandardTimes;
}

const SwimContext = createContext<SwimContextType | null>(null);

const KEYS = {
  meets:       '@swim_meets',
  timeEntries: '@swim_time_entries_v2',
  settings:    '@swim_settings_v4',
};

export function SwimProvider({ children }: { children: React.ReactNode }) {
  const [meets, setMeets] = useState<Meet[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedGender, setGenderState] = useState<Gender>('F');
  const [selectedAgeGroup, setAgeGroupState] = useState<AgeGroup>('11-12');
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs so async persist always sees latest values
  const genderRef = useRef<Gender>('F');
  const ageGroupRef = useRef<AgeGroup>('11-12');

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [mt, te, st] = await Promise.all([
        AsyncStorage.getItem(KEYS.meets),
        AsyncStorage.getItem(KEYS.timeEntries),
        AsyncStorage.getItem(KEYS.settings),
      ]);
      if (mt) setMeets(JSON.parse(mt));
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

  const addMeet = useCallback(async (meet: Omit<Meet, 'id'>): Promise<Meet> => {
    const m: Meet = { ...meet, id: generateId() };
    setMeets(prev => {
      const next = [...prev, m];
      AsyncStorage.setItem(KEYS.meets, JSON.stringify(next));
      return next;
    });
    return m;
  }, []);

  const deleteMeet = useCallback(async (id: string) => {
    setMeets(prev => {
      const next = prev.filter(m => m.id !== id);
      AsyncStorage.setItem(KEYS.meets, JSON.stringify(next));
      return next;
    });
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
      meets, timeEntries,
      selectedGender, selectedAgeGroup,
      isLoaded,
      setSelectedGender, setSelectedAgeGroup,
      addMeet, deleteMeet, addTimeEntry, deleteTimeEntry,
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
