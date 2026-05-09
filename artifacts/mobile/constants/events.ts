export type StrokeType = 'Free' | 'Back' | 'Breast' | 'Fly' | 'IM';

export interface SwimEvent {
  id: string;
  displayName: string;
  distance: number;
  stroke: StrokeType;
  sortOrder: number;
}

export const EVENTS: SwimEvent[] = [
  { id: '50free',    displayName: '50 Free',    distance: 50,   stroke: 'Free',   sortOrder: 1 },
  { id: '100free',   displayName: '100 Free',   distance: 100,  stroke: 'Free',   sortOrder: 2 },
  { id: '200free',   displayName: '200 Free',   distance: 200,  stroke: 'Free',   sortOrder: 3 },
  { id: '500free',   displayName: '500 Free',   distance: 500,  stroke: 'Free',   sortOrder: 4 },
  { id: '1000free',  displayName: '1000 Free',  distance: 1000, stroke: 'Free',   sortOrder: 5 },
  { id: '1650free',  displayName: '1650 Free',  distance: 1650, stroke: 'Free',   sortOrder: 6 },
  { id: '100back',   displayName: '100 Back',   distance: 100,  stroke: 'Back',   sortOrder: 7 },
  { id: '200back',   displayName: '200 Back',   distance: 200,  stroke: 'Back',   sortOrder: 8 },
  { id: '100breast', displayName: '100 Breast', distance: 100,  stroke: 'Breast', sortOrder: 9 },
  { id: '200breast', displayName: '200 Breast', distance: 200,  stroke: 'Breast', sortOrder: 10 },
  { id: '100fly',    displayName: '100 Fly',    distance: 100,  stroke: 'Fly',    sortOrder: 11 },
  { id: '200fly',    displayName: '200 Fly',    distance: 200,  stroke: 'Fly',    sortOrder: 12 },
  { id: '200im',     displayName: '200 IM',     distance: 200,  stroke: 'IM',     sortOrder: 13 },
  { id: '400im',     displayName: '400 IM',     distance: 400,  stroke: 'IM',     sortOrder: 14 },
];

export function getEventById(id: string): SwimEvent | undefined {
  return EVENTS.find(e => e.id === id);
}

export const STROKE_COLORS: Record<StrokeType, string> = {
  Free:   '#0070CC',
  Back:   '#7C3AED',
  Breast: '#059669',
  Fly:    '#D97706',
  IM:     '#DC2626',
};
