import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { AgeGroup, Gender, StandardTimes } from '@/constants/standards';
import { get2026Times } from '@/constants/standards';
import { birthYearToAgeGroup, generateId } from '@/utils/timeUtils';

export interface Swimmer {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number;
}

export interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
}

export interface TimeEntry {
  id: string;
  swimmerId: string;
  meetId: string;
  eventId: string;
  timeHundredths: number;
  date: string;
}

interface SwimContextType {
  swimmers: Swimmer[];
  meets: Meet[];
  timeEntries: TimeEntry[];
  selectedSwimmerId: string | null;
  isLoaded: boolean;

  addSwimmer: (swimmer: Omit<Swimmer, 'id'>) => Promise<void>;
  updateSwimmer: (swimmer: Swimmer) => Promise<void>;
  deleteSwimmer: (id: string) => Promise<void>;
  addMeet: (meet: Omit<Meet, 'id'>) => Promise<Meet>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  setSelectedSwimmerId: (id: string | null) => Promise<void>;

  getSwimmerAgeGroup: (swimmer: Swimmer) => AgeGroup;
  getBestTimeForEvent: (swimmerId: string, eventId: string) => TimeEntry | null;
  getStandardTimes: (swimmerId: string, eventId: string) => StandardTimes;
  getSelectedSwimmer: () => Swimmer | null;
}

const SwimContext = createContext<SwimContextType | null>(null);

const KEYS = {
  swimmers:    '@swim_swimmers',
  meets:       '@swim_meets',
  timeEntries: '@swim_time_entries',
  settings:    '@swim_settings_v3',
};

export function SwimProvider({ children }: { children: React.ReactNode }) {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedSwimmerId, setSelectedSwimmerIdState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      const [sw, mt, te, st] = await Promise.all([
        AsyncStorage.getItem(KEYS.swimmers),
        AsyncStorage.getItem(KEYS.meets),
        AsyncStorage.getItem(KEYS.timeEntries),
        AsyncStorage.getItem(KEYS.settings),
      ]);
      if (sw) setSwimmers(JSON.parse(sw));
      if (mt) setMeets(JSON.parse(mt));
      if (te) setTimeEntries(JSON.parse(te));
      if (st) {
        const s = JSON.parse(st);
        if (s.selectedSwimmerId !== undefined) setSelectedSwimmerIdState(s.selectedSwimmerId);
      }
    } catch (e) {
      console.warn('Failed to load swim data:', e);
    } finally {
      setIsLoaded(true);
    }
  }

  async function persistSettings(swimmerId: string | null) {
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify({ selectedSwimmerId: swimmerId }));
  }

  const addSwimmer = useCallback(async (swimmer: Omit<Swimmer, 'id'>) => {
    const s: Swimmer = { ...swimmer, id: generateId() };
    const next = [...swimmers, s];
    setSwimmers(next);
    await AsyncStorage.setItem(KEYS.swimmers, JSON.stringify(next));
    if (!selectedSwimmerId) {
      setSelectedSwimmerIdState(s.id);
      await persistSettings(s.id);
    }
  }, [swimmers, selectedSwimmerId]);

  const updateSwimmer = useCallback(async (swimmer: Swimmer) => {
    const next = swimmers.map(s => s.id === swimmer.id ? swimmer : s);
    setSwimmers(next);
    await AsyncStorage.setItem(KEYS.swimmers, JSON.stringify(next));
  }, [swimmers]);

  const deleteSwimmer = useCallback(async (id: string) => {
    const next = swimmers.filter(s => s.id !== id);
    setSwimmers(next);
    await AsyncStorage.setItem(KEYS.swimmers, JSON.stringify(next));
    if (selectedSwimmerId === id) {
      const newSel = next[0]?.id ?? null;
      setSelectedSwimmerIdState(newSel);
      await persistSettings(newSel);
    }
  }, [swimmers, selectedSwimmerId]);

  const addMeet = useCallback(async (meet: Omit<Meet, 'id'>): Promise<Meet> => {
    const m: Meet = { ...meet, id: generateId() };
    const next = [...meets, m];
    setMeets(next);
    await AsyncStorage.setItem(KEYS.meets, JSON.stringify(next));
    return m;
  }, [meets]);

  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'date'>) => {
    const e: TimeEntry = { ...entry, id: generateId(), date: new Date().toISOString() };
    const next = [...timeEntries, e];
    setTimeEntries(next);
    await AsyncStorage.setItem(KEYS.timeEntries, JSON.stringify(next));
  }, [timeEntries]);

  const deleteTimeEntry = useCallback(async (id: string) => {
    const next = timeEntries.filter(e => e.id !== id);
    setTimeEntries(next);
    await AsyncStorage.setItem(KEYS.timeEntries, JSON.stringify(next));
  }, [timeEntries]);

  const setSelectedSwimmerId = useCallback(async (id: string | null) => {
    setSelectedSwimmerIdState(id);
    await persistSettings(id);
  }, []);

  const getSwimmerAgeGroup = useCallback((swimmer: Swimmer): AgeGroup => {
    return birthYearToAgeGroup(swimmer.birthYear);
  }, []);

  const getBestTimeForEvent = useCallback((swimmerId: string, eventId: string): TimeEntry | null => {
    const entries = timeEntries.filter(e => e.swimmerId === swimmerId && e.eventId === eventId);
    if (!entries.length) return null;
    return entries.reduce((best, cur) => cur.timeHundredths < best.timeHundredths ? cur : best);
  }, [timeEntries]);

  const getStandardTimes = useCallback((swimmerId: string, eventId: string): StandardTimes => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    if (!swimmer) return { silver: null, gold: null, zone: null };
    const ageGroup = birthYearToAgeGroup(swimmer.birthYear);
    return get2026Times(ageGroup, swimmer.gender, eventId);
  }, [swimmers]);

  const getSelectedSwimmer = useCallback((): Swimmer | null => {
    if (!selectedSwimmerId) return null;
    return swimmers.find(s => s.id === selectedSwimmerId) ?? null;
  }, [swimmers, selectedSwimmerId]);

  return (
    <SwimContext.Provider value={{
      swimmers, meets, timeEntries,
      selectedSwimmerId, isLoaded,
      addSwimmer, updateSwimmer, deleteSwimmer,
      addMeet, addTimeEntry, deleteTimeEntry,
      setSelectedSwimmerId,
      getSwimmerAgeGroup, getBestTimeForEvent, getStandardTimes, getSelectedSwimmer,
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
