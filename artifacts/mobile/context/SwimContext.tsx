import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import type { AgeGroup, CourseType, Gender, StandardLevel } from '@/constants/standards';
import {
  DEFAULT_STANDARD_LEVEL,
  DEFAULT_STANDARD_SET_ID,
  STANDARD_SETS,
  getStandard,
  getStandardSet,
} from '@/constants/standards';
import { generateId } from '@/utils/timeUtils';

export interface Swimmer {
  id: string;
  name: string;
  gender: Gender;
  birthYear: number;
  ageGroup: AgeGroup;
}

export interface Meet {
  id: string;
  name: string;
  date: string;
  location: string;
  courseType: CourseType;
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
  selectedStandardSetId: string;
  selectedStandardLevel: StandardLevel;
  selectedCourseType: CourseType;
  isLoaded: boolean;

  addSwimmer: (swimmer: Omit<Swimmer, 'id'>) => Promise<void>;
  updateSwimmer: (swimmer: Swimmer) => Promise<void>;
  deleteSwimmer: (id: string) => Promise<void>;
  addMeet: (meet: Omit<Meet, 'id'>) => Promise<Meet>;
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'date'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;

  setSelectedSwimmerId: (id: string | null) => Promise<void>;
  setSelectedStandardSetId: (setId: string) => Promise<void>;
  setSelectedStandardLevel: (level: StandardLevel) => Promise<void>;

  getBestTimeForEvent: (swimmerId: string, eventId: string) => TimeEntry | null;
  getDeltaToStandard: (swimmerId: string, eventId: string, level?: StandardLevel, setId?: string) => number | null;
  getStandardTime: (swimmerId: string, eventId: string, level?: StandardLevel, setId?: string) => number | null;
  getSelectedSwimmer: () => Swimmer | null;
}

const SwimContext = createContext<SwimContextType | null>(null);

const KEYS = {
  swimmers: '@swim_swimmers',
  meets: '@swim_meets',
  timeEntries: '@swim_time_entries',
  settings: '@swim_settings_v2',
};

interface Settings {
  selectedSwimmerId: string | null;
  selectedStandardSetId: string;
  selectedStandardLevel: StandardLevel;
}

export function SwimProvider({ children }: { children: React.ReactNode }) {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [meets, setMeets] = useState<Meet[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [selectedSwimmerId, setSelectedSwimmerIdState] = useState<string | null>(null);
  const [selectedStandardSetId, setSelectedStandardSetIdState] = useState<string>(DEFAULT_STANDARD_SET_ID);
  const [selectedStandardLevel, setSelectedStandardLevelState] = useState<StandardLevel>(DEFAULT_STANDARD_LEVEL);
  const [isLoaded, setIsLoaded] = useState(false);

  const selectedCourseType: CourseType = getStandardSet(selectedStandardSetId)?.courseType ?? 'SCY';

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
        const s: Settings = JSON.parse(st);
        if (s.selectedSwimmerId !== undefined) setSelectedSwimmerIdState(s.selectedSwimmerId);
        if (s.selectedStandardSetId) setSelectedStandardSetIdState(s.selectedStandardSetId);
        if (s.selectedStandardLevel) setSelectedStandardLevelState(s.selectedStandardLevel);
      }
    } catch (e) {
      console.warn('Failed to load swim data:', e);
    } finally {
      setIsLoaded(true);
    }
  }

  async function persistSettings(overrides: Partial<Settings>) {
    const current: Settings = {
      selectedSwimmerId,
      selectedStandardSetId,
      selectedStandardLevel,
      ...overrides,
    };
    await AsyncStorage.setItem(KEYS.settings, JSON.stringify(current));
  }

  const addSwimmer = useCallback(async (swimmer: Omit<Swimmer, 'id'>) => {
    const newSwimmer: Swimmer = { ...swimmer, id: generateId() };
    const next = [...swimmers, newSwimmer];
    setSwimmers(next);
    await AsyncStorage.setItem(KEYS.swimmers, JSON.stringify(next));
    if (!selectedSwimmerId) {
      setSelectedSwimmerIdState(newSwimmer.id);
      await persistSettings({ selectedSwimmerId: newSwimmer.id });
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
      await persistSettings({ selectedSwimmerId: newSel });
    }
  }, [swimmers, selectedSwimmerId]);

  const addMeet = useCallback(async (meet: Omit<Meet, 'id'>): Promise<Meet> => {
    const newMeet: Meet = { ...meet, id: generateId() };
    const next = [...meets, newMeet];
    setMeets(next);
    await AsyncStorage.setItem(KEYS.meets, JSON.stringify(next));
    return newMeet;
  }, [meets]);

  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, 'id' | 'date'>) => {
    const newEntry: TimeEntry = { ...entry, id: generateId(), date: new Date().toISOString() };
    const next = [...timeEntries, newEntry];
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
    await persistSettings({ selectedSwimmerId: id });
  }, [selectedStandardSetId, selectedStandardLevel]);

  const setSelectedStandardSetId = useCallback(async (setId: string) => {
    const set = STANDARD_SETS.find(s => s.id === setId);
    if (!set) return;
    setSelectedStandardSetIdState(setId);
    // Auto-reset level to first valid if current level isn't in this set
    const levelValid = set.levels.some(l => l.level === selectedStandardLevel);
    const newLevel = levelValid ? selectedStandardLevel : set.levels[0].level;
    setSelectedStandardLevelState(newLevel);
    await persistSettings({ selectedStandardSetId: setId, selectedStandardLevel: newLevel });
  }, [selectedSwimmerId, selectedStandardLevel]);

  const setSelectedStandardLevel = useCallback(async (level: StandardLevel) => {
    setSelectedStandardLevelState(level);
    await persistSettings({ selectedStandardLevel: level });
  }, [selectedSwimmerId, selectedStandardSetId]);

  const getBestTimeForEvent = useCallback((swimmerId: string, eventId: string): TimeEntry | null => {
    const entries = timeEntries.filter(e => e.swimmerId === swimmerId && e.eventId === eventId);
    if (!entries.length) return null;
    return entries.reduce((best, cur) => cur.timeHundredths < best.timeHundredths ? cur : best);
  }, [timeEntries]);

  const getDeltaToStandard = useCallback((
    swimmerId: string,
    eventId: string,
    level?: StandardLevel,
    setId?: string,
  ): number | null => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    if (!swimmer) return null;
    const lvl = level ?? selectedStandardLevel;
    const sid = setId ?? selectedStandardSetId;
    const standard = getStandard(sid, swimmer.ageGroup, swimmer.gender, eventId, lvl);
    if (!standard) return null;
    const best = getBestTimeForEvent(swimmerId, eventId);
    if (!best) return null;
    return best.timeHundredths - standard.timeHundredths;
  }, [swimmers, selectedStandardLevel, selectedStandardSetId, getBestTimeForEvent]);

  const getStandardTime = useCallback((
    swimmerId: string,
    eventId: string,
    level?: StandardLevel,
    setId?: string,
  ): number | null => {
    const swimmer = swimmers.find(s => s.id === swimmerId);
    if (!swimmer) return null;
    const lvl = level ?? selectedStandardLevel;
    const sid = setId ?? selectedStandardSetId;
    const standard = getStandard(sid, swimmer.ageGroup, swimmer.gender, eventId, lvl);
    return standard?.timeHundredths ?? null;
  }, [swimmers, selectedStandardLevel, selectedStandardSetId]);

  const getSelectedSwimmer = useCallback((): Swimmer | null => {
    if (!selectedSwimmerId) return null;
    return swimmers.find(s => s.id === selectedSwimmerId) ?? null;
  }, [swimmers, selectedSwimmerId]);

  return (
    <SwimContext.Provider value={{
      swimmers, meets, timeEntries,
      selectedSwimmerId, selectedStandardSetId, selectedStandardLevel, selectedCourseType,
      isLoaded,
      addSwimmer, updateSwimmer, deleteSwimmer,
      addMeet, addTimeEntry, deleteTimeEntry,
      setSelectedSwimmerId, setSelectedStandardSetId, setSelectedStandardLevel,
      getBestTimeForEvent, getDeltaToStandard, getStandardTime, getSelectedSwimmer,
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
