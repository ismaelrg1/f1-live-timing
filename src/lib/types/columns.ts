
export type DriverColumnId =
  | 'position'
  | 'driver'
  | 'team'
  | 'gapToLeader'
  | 'intervalToAhead'
  | 'lastLap'
  | 'bestLap'
  | 'sectors'
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