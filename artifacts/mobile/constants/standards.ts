export type Gender = 'M' | 'F';
export type AgeGroup = '10&U' | '11-12' | '13-14' | '15-18';
export type CourseType = 'LCM';

export const AGE_GROUPS: AgeGroup[] = ['10&U', '11-12', '13-14', '15-18'];

export interface StandardTimes {
  silver: number | null;
  gold: number | null;
  zone: number | null;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function t(str: string): number {
  const parts = str.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const [secStr, centStr = '00'] = parts[1].split('.');
    return (mins * 60 + parseInt(secStr, 10)) * 100 + parseInt(centStr.padEnd(2, '0'), 10);
  }
  const [secStr, centStr = '00'] = str.split('.');
  return parseInt(secStr, 10) * 100 + parseInt(centStr.padEnd(2, '0'), 10);
}

// ─── Data structure ───────────────────────────────────────────────────────────
// STANDARDS_2026[eventId][ageGroup][gender] = { silver, gold, zone }
// Source: 2026 NJ LSC LCM Silver/Gold cuts + EZ LCM AG Zone 2026 qualifying times
// Zone data covers 10&U, 11-12, 13-14 only (15-18 LCM Zone not published in provided document)

type GenderRow = { F: StandardTimes; M: StandardTimes };
type EventMap = Record<AgeGroup, GenderRow>;

export const STANDARDS_2026: Record<string, EventMap> = {
  '50free': {
    '10&U': {
      F: { silver: t('42.89'), gold: t('37.99'), zone: t('34.49') },
      M: { silver: t('43.59'), gold: t('37.69'), zone: t('34.09') },
    },
    '11-12': {
      F: { silver: t('35.49'), gold: t('32.99'), zone: t('29.99') },
      M: { silver: t('35.59'), gold: t('32.39'), zone: t('29.69') },
    },
    '13-14': {
      F: { silver: t('32.89'), gold: t('30.79'), zone: t('29.19') },
      M: { silver: t('30.39'), gold: t('28.59'), zone: t('27.29') },
    },
    '15-18': {
      F: { silver: t('31.79'), gold: t('29.89'), zone: null },
      M: { silver: t('27.49'), gold: t('26.49'), zone: null },
    },
  },
  '100free': {
    '10&U': {
      F: { silver: t('1:36.79'), gold: t('1:25.59'), zone: t('1:15.19') },
      M: { silver: t('1:34.19'), gold: t('1:24.99'), zone: t('1:14.09') },
    },
    '11-12': {
      F: { silver: t('1:17.29'), gold: t('1:11.99'), zone: t('1:05.19') },
      M: { silver: t('1:16.79'), gold: t('1:10.99'), zone: t('1:04.09') },
    },
    '13-14': {
      F: { silver: t('1:09.59'), gold: t('1:06.49'), zone: t('1:03.19') },
      M: { silver: t('1:05.59'), gold: t('1:01.89'), zone: t('59.29') },
    },
    '15-18': {
      F: { silver: t('1:06.39'), gold: t('1:04.29'), zone: null },
      M: { silver: t('58.79'), gold: t('57.09'), zone: null },
    },
  },
  '200free': {
    '10&U': {
      F: { silver: t('3:30.29'), gold: t('2:56.29'), zone: t('2:41.09') },
      M: { silver: t('3:31.29'), gold: t('2:50.79'), zone: t('2:38.99') },
    },
    '11-12': {
      F: { silver: t('2:47.19'), gold: t('2:34.89'), zone: t('2:20.29') },
      M: { silver: t('2:45.79'), gold: t('2:32.19'), zone: t('2:15.99') },
    },
    '13-14': {
      F: { silver: t('2:30.59'), gold: t('2:23.19'), zone: t('2:14.99') },
      M: { silver: t('2:22.19'), gold: t('2:14.49'), zone: t('2:06.79') },
    },
    '15-18': {
      F: { silver: t('2:25.09'), gold: t('2:17.99'), zone: null },
      M: { silver: t('2:09.29'), gold: t('2:04.79'), zone: null },
    },
  },
  '400free': {
    '10&U': {
      F: { silver: t('7:36.79'), gold: t('6:05.39'), zone: t('5:37.79') },
      M: { silver: t('7:29.29'), gold: t('5:59.49'), zone: t('5:37.69') },
    },
    '11-12': {
      F: { silver: t('5:56.49'), gold: t('5:29.09'), zone: t('4:57.89') },
      M: { silver: t('6:15.49'), gold: t('5:21.89'), zone: t('4:51.09') },
    },
    '13-14': {
      F: { silver: t('5:15.69'), gold: t('5:01.29'), zone: t('4:44.79') },
      M: { silver: t('5:06.99'), gold: t('4:46.69'), zone: t('4:30.59') },
    },
    '15-18': {
      F: { silver: t('5:15.89'), gold: t('4:54.49'), zone: null },
      M: { silver: t('4:43.79'), gold: t('4:25.89'), zone: null },
    },
  },
  '800free': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('12:26.69'), gold: t('11:29.29'), zone: null },
      M: { silver: t('12:15.19'), gold: t('11:18.59'), zone: null },
    },
    '13-14': {
      F: { silver: t('11:41.99'), gold: t('10:21.99'), zone: t('9:48.29') },
      M: { silver: t('11:13.99'), gold: t('9:56.29'), zone: t('9:20.89') },
    },
    '15-18': {
      F: { silver: t('11:28.39'), gold: t('10:10.99'), zone: null },
      M: { silver: t('10:50.09'), gold: t('9:27.39'), zone: null },
    },
  },
  '1500free': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('23:55.39'), gold: t('22:06.99'), zone: null },
      M: { silver: t('23:25.49'), gold: t('21:39.39'), zone: null },
    },
    '13-14': {
      F: { silver: t('22:23.09'), gold: t('19:49.09'), zone: t('19:00.49') },
      M: { silver: t('21:27.39'), gold: t('18:58.99'), zone: t('18:00.79') },
    },
    '15-18': {
      F: { silver: t('22:02.19'), gold: t('19:30.59'), zone: null },
      M: { silver: t('20:33.99'), gold: t('18:11.69'), zone: null },
    },
  },
  '50back': {
    '10&U': {
      F: { silver: t('50.19'), gold: t('45.29'), zone: t('40.59') },
      M: { silver: t('52.49'), gold: t('44.49'), zone: t('40.39') },
    },
    '11-12': {
      F: { silver: t('42.79'), gold: t('39.19'), zone: t('34.89') },
      M: { silver: t('42.29'), gold: t('38.69'), zone: t('34.19') },
    },
    '13-14': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '15-18': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
  },
  '100back': {
    '10&U': {
      F: { silver: t('1:48.19'), gold: t('1:38.29'), zone: t('1:26.79') },
      M: { silver: t('1:47.69'), gold: t('1:37.19'), zone: t('1:26.09') },
    },
    '11-12': {
      F: { silver: t('1:30.39'), gold: t('1:23.79'), zone: t('1:14.09') },
      M: { silver: t('1:30.49'), gold: t('1:23.19'), zone: t('1:12.89') },
    },
    '13-14': {
      F: { silver: t('1:20.49'), gold: t('1:16.09'), zone: t('1:12.19') },
      M: { silver: t('1:16.79'), gold: t('1:12.19'), zone: t('1:08.19') },
    },
    '15-18': {
      F: { silver: t('1:17.19'), gold: t('1:12.99'), zone: null },
      M: { silver: t('1:09.89'), gold: t('1:06.29'), zone: null },
    },
  },
  '200back': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('3:09.89'), gold: t('2:55.49'), zone: t('2:38.29') },
      M: { silver: t('3:19.49'), gold: t('2:51.99'), zone: t('2:34.99') },
    },
    '13-14': {
      F: { silver: t('2:49.59'), gold: t('2:38.09'), zone: t('2:33.29') },
      M: { silver: t('2:43.19'), gold: t('2:29.59'), zone: t('2:23.89') },
    },
    '15-18': {
      F: { silver: t('2:45.59'), gold: t('2:34.39'), zone: null },
      M: { silver: t('2:34.89'), gold: t('2:22.49'), zone: null },
    },
  },
  '50breast': {
    '10&U': {
      F: { silver: t('58.69'), gold: t('51.88'), zone: t('46.09') },
      M: { silver: t('59.69'), gold: t('52.59'), zone: t('46.79') },
    },
    '11-12': {
      F: { silver: t('48.59'), gold: t('44.29'), zone: t('39.19') },
      M: { silver: t('48.99'), gold: t('44.49'), zone: t('38.59') },
    },
    '13-14': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '15-18': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
  },
  '100breast': {
    '10&U': {
      F: { silver: t('2:07.59'), gold: t('1:54.19'), zone: t('1:39.19') },
      M: { silver: t('2:09.39'), gold: t('1:55.99'), zone: t('1:39.99') },
    },
    '11-12': {
      F: { silver: t('1:43.09'), gold: t('1:36.59'), zone: t('1:25.09') },
      M: { silver: t('1:46.59'), gold: t('1:37.29'), zone: t('1:24.09') },
    },
    '13-14': {
      F: { silver: t('1:34.49'), gold: t('1:27.69'), zone: t('1:21.39') },
      M: { silver: t('1:29.79'), gold: t('1:22.29'), zone: t('1:17.49') },
    },
    '15-18': {
      F: { silver: t('1:36.29'), gold: t('1:24.49'), zone: null },
      M: { silver: t('1:19.39'), gold: t('1:13.99'), zone: null },
    },
  },
  '200breast': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('3:35.99'), gold: t('3:19.39'), zone: t('3:00.99') },
      M: { silver: t('3:44.69'), gold: t('3:13.59'), zone: t('2:58.19') },
    },
    '13-14': {
      F: { silver: t('3:17.79'), gold: t('3:00.49'), zone: t('2:56.39') },
      M: { silver: t('3:05.69'), gold: t('2:48.79'), zone: t('2:44.89') },
    },
    '15-18': {
      F: { silver: t('3:20.49'), gold: t('2:57.39'), zone: null },
      M: { silver: t('2:55.29'), gold: t('2:40.49'), zone: null },
    },
  },
  '50fly': {
    '10&U': {
      F: { silver: t('53.39'), gold: t('45.09'), zone: t('38.19') },
      M: { silver: t('51.79'), gold: t('44.39'), zone: t('37.89') },
    },
    '11-12': {
      F: { silver: t('41.69'), gold: t('36.99'), zone: t('32.29') },
      M: { silver: t('41.89'), gold: t('36.59'), zone: t('31.79') },
    },
    '13-14': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '15-18': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
  },
  '100fly': {
    '10&U': {
      F: { silver: t('2:09.99'), gold: t('1:52.99'), zone: t('1:26.99') },
      M: { silver: t('2:07.09'), gold: t('1:50.79'), zone: t('1:27.29') },
    },
    '11-12': {
      F: { silver: t('1:36.19'), gold: t('1:27.29'), zone: t('1:12.69') },
      M: { silver: t('1:33.99'), gold: t('1:26.29'), zone: t('1:11.39') },
    },
    '13-14': {
      F: { silver: t('1:22.89'), gold: t('1:16.39'), zone: t('1:09.79') },
      M: { silver: t('1:18.59'), gold: t('1:11.49'), zone: t('1:04.99') },
    },
    '15-18': {
      F: { silver: t('1:19.19'), gold: t('1:11.09'), zone: null },
      M: { silver: t('1:06.69'), gold: t('1:03.29'), zone: null },
    },
  },
  '200fly': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('3:26.09'), gold: t('2:57.59'), zone: t('2:44.59') },
      M: { silver: t('3:20.49'), gold: t('2:53.89'), zone: t('2:42.49') },
    },
    '13-14': {
      F: { silver: t('3:12.99'), gold: t('2:38.59'), zone: t('2:38.09') },
      M: { silver: t('3:00.89'), gold: t('2:29.59'), zone: t('2:26.39') },
    },
    '15-18': {
      F: { silver: t('3:07.29'), gold: t('2:33.89'), zone: null },
      M: { silver: t('2:52.29'), gold: t('2:23.49'), zone: null },
    },
  },
  '200im': {
    '10&U': {
      F: { silver: t('4:09.39'), gold: t('3:18.09'), zone: t('3:02.49') },
      M: { silver: t('4:06.19'), gold: t('3:16.39'), zone: t('2:59.89') },
    },
    '11-12': {
      F: { silver: t('3:11.39'), gold: t('2:55.29'), zone: t('2:39.19') },
      M: { silver: t('3:09.49'), gold: t('2:53.19'), zone: t('2:35.69') },
    },
    '13-14': {
      F: { silver: t('2:50.49'), gold: t('2:40.79'), zone: t('2:33.09') },
      M: { silver: t('2:39.19'), gold: t('2:31.59'), zone: t('2:23.59') },
    },
    '15-18': {
      F: { silver: t('2:44.79'), gold: t('2:36.29'), zone: null },
      M: { silver: t('2:26.99'), gold: t('2:20.89'), zone: null },
    },
  },
  '400im': {
    '10&U': {
      F: { silver: null, gold: null, zone: null },
      M: { silver: null, gold: null, zone: null },
    },
    '11-12': {
      F: { silver: t('7:16.69'), gold: t('6:17.89'), zone: null },
      M: { silver: t('7:09.89'), gold: t('6:09.49'), zone: null },
    },
    '13-14': {
      F: { silver: t('6:11.59'), gold: t('5:41.29'), zone: t('5:25.09') },
      M: { silver: t('5:53.69'), gold: t('5:22.59'), zone: t('5:05.19') },
    },
    '15-18': {
      F: { silver: t('6:18.79'), gold: t('5:35.09'), zone: null },
      M: { silver: t('5:31.29'), gold: t('5:05.29'), zone: null },
    },
  },
};

// ─── Lookup ───────────────────────────────────────────────────────────────────
export function get2026Times(ageGroup: AgeGroup, gender: Gender, eventId: string): StandardTimes {
  return STANDARDS_2026[eventId]?.[ageGroup]?.[gender] ?? { silver: null, gold: null, zone: null };
}
