export type Compound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

export type SessionType = 'PRACTICE' | 'QUALIFYING' | 'RACE' | 'SPRINT' | 'TEST' | string;

export type SessionStatus = 'STARTED' | 'FINISHED' | 'INACTIVE' | 'FINALISED' | 'ENDS' | string;

export type TrackStatusCode = '1' | '2' | '4' | '5' | '6' | '7' | string;

export type MiniSectorStatus = 0 | 2048 | 2049 | 2050 | 2051 | 2052 | 2064 | number;

export interface MiniSector {
  index: number;
  status: MiniSectorStatus;
}

export interface Sector {
  index: number;
  value: string;
  previousValue?: string;
  personalFastest: boolean;
  overallFastest: boolean;
  stopped: boolean;
  segments: MiniSector[];
}

export interface LastLapSector {
  index: number;
  value: string;
  personalFastest: boolean;
  overallFastest: boolean;
}

export interface Stint {
  index: number;
  compound: Compound;
  new: boolean;
  tyresNotChanged: boolean;
  totalLaps: number;
  startLaps: number;
  lapTime?: string;
  lapNumber?: number;
  lapFlags?: number;
}

export interface DashboardSessionState {
  sessionKey: number | null;
  meetingKey: number | null;
  meetingName: string;
  circuitName: string;
  countryCode: string;

  sessionType: SessionType;
  sessionName: string;
  sessionStatus: SessionStatus;
  archiveStatus: string;

  startDate: string;
  endDate: string;
  gmtOffset: string;

  clockUtc: string;
  clockRemaining: string;
  clockRunning: boolean;

  currentLap: number | null;

  qualifyingPart: number | null;
  qualifyingPartLabel: 'Q1' | 'Q2' | 'Q3' | null;

  trackStatusCode: TrackStatusCode;
  trackStatusMessage: string;

  cutOffTime: string;
  cutOffPercentage: string;
}

export interface DriverRow {
  position: string;
  racingNumber: string;
  tla: string;
  driverName: string;
  broadcastName: string;
  team: string;
  teamColour: string;

  gapToLeader: string;
  intervalToAhead: string;
  catchingAhead: boolean;

  lastLap: string;
  lastLapPersonalBest: boolean;
  lastLapOverallBest: boolean;

  bestLap: string;
  bestLapLap: number | null;
  bestLapRank: number | null;

  sectors: Sector[];
  lastLapSectors: LastLapSector[];
  bestSectors: BestSector[];

  laps: number;
  pitStops: number;

  compound: Compound;
  tyreLaps: number;
  stintLaps: number;
  isNewTyre: boolean;
  tyresNotChanged: boolean;

  gridPosition: number | null;
  gridDelta: number | null;

  retired: boolean;
  stopped: boolean;
  inPit: boolean;
  pitOut: boolean;
  outlap: boolean;

  stints: Stint[];

  knockedOut: boolean;
  cutoff: boolean;
  timeDiffToFastest: string;
  timeDiffToPositionAhead: string;
}

export interface BestSector {
  index: number;
  value: string;
  position: number | null;
}
