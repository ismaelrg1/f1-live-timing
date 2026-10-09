
export type DriverColumnId =
  | 'position'
  | 'driver'
  | 'team'
  | 'gapToLeader'
  | 'intervalToAhead'
  | 'lastLap'
  | 'bestLap'
  | 'sectors'
  | 'lastSectors'
  | 'miniSectors'
  | 'laps'
  | 'pitStops'
  | 'tyres'
  | 'gridDelta'
  | 'status'
  | 'stints'
  | 'qualyStatus'
  | 'timeDiffToFastest'
  | 'timeDiffToPositionAhead';

export type ColumnAlign = 'left' | 'center' | 'right';

export type ColumnGroup =
  | 'driver'
  | 'timing'
  | 'sectors'
  | 'strategy'
  | 'status'
  | 'qualifying';

export interface ColumnDefinition {
  id: DriverColumnId;
  label: string;
  shortLabel?: string;
  group: ColumnGroup;
  visibleByDefault: boolean;
  align: ColumnAlign;
  width?: string;
  sticky?: boolean;
}


export const driverColumns: ColumnDefinition[] = [
  {
    id: 'status',
    label: 'PIT',
    group: 'status',
    visibleByDefault: true,
    align: 'center',
    width: '56px'
  },
  {
    id: 'driver',
    label: 'DRIVER',
    group: 'driver',
    visibleByDefault: true,
    align: 'left',
    width: '220px',
    sticky: true
  },
  {
    id: 'tyres',
    label: 'TYRE',
    group: 'strategy',
    visibleByDefault: true,
    align: 'center',
    width: '78px'
  },
  {
    id: 'bestLap',
    label: 'BEST LAP',
    group: 'timing',
    visibleByDefault: true,
    align: 'right',
    width: '96px'
  },
  {
    id: 'intervalToAhead',
    label: 'INT',
    shortLabel: 'INT',
    group: 'timing',
    visibleByDefault: true,
    align: 'right',
    width: '80px'
  },
  {
    id: 'gapToLeader',
    label: 'GAP',
    group: 'timing',
    visibleByDefault: true,
    align: 'right',
    width: '80px'
  },
  {
    id: 'lastLap',
    label: 'LAST LAP',
    group: 'timing',
    visibleByDefault: true,
    align: 'right',
    width: '96px'
  },
  {
    id: 'sectors',
    label: 'SECTORS',
    group: 'sectors',
    visibleByDefault: true,
    align: 'center',
    width: '280px'
  },
   {
    id: 'lastSectors',
    label: 'LAST SECTORS',
    group: 'sectors',
    visibleByDefault: true,
    align: 'center',
    width: '170px'
  },
  {
    id: 'stints',
    label: 'STINTS',
    group: 'strategy',
    visibleByDefault: false,
    align: 'center',
    width: '420px'
  },
  {
    id: 'laps',
    label: 'LAPS',
    group: 'timing',
    visibleByDefault: true,
    align: 'center',
    width: '70px'
  }
];
