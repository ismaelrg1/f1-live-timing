import type { RaceControlMessage } from '../../types/raceControl';

export type RaceControlFilterId =
  | 'all'
  | 'yellow'
  | 'clear'
  | 'green'
  | 'red'
  | 'blue'
  | 'blackWhite'
  | 'chequered'
  | 'safetyCar'
  | 'trackLimits'
  | 'incidents'
  | 'penalties'
  | 'session'
  | 'pitLane'
  | 'drs'
  | 'trackSurface'
  | 'other';

export interface RaceControlFilter {
  id: RaceControlFilterId;
  label: string;
}

export const raceControlFilters: RaceControlFilter[] = [
  { id: 'all', label: 'All' },
  { id: 'yellow', label: 'Yellow' },
  { id: 'clear', label: 'Clear' },
  { id: 'green', label: 'Green' },
  { id: 'red', label: 'Red' },
  { id: 'blue', label: 'Blue' },
  { id: 'blackWhite', label: 'B/W' },
  { id: 'chequered', label: 'Chequered' },
  { id: 'safetyCar', label: 'SC/VSC' },
  { id: 'trackLimits', label: 'Track limits' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'penalties', label: 'Penalties' },
  { id: 'session', label: 'Session' },
  { id: 'pitLane', label: 'Pit lane' },
  { id: 'drs', label: 'DRS' },
  { id: 'trackSurface', label: 'Surface' },
  { id: 'other', label: 'Other' }
];

export function raceControlKind(message: RaceControlMessage): RaceControlFilterId {
  const text = message.message.toUpperCase();
  const category = message.category.toUpperCase();
  const flag = message.flag.toUpperCase();

  if (text.includes('TRACK LIMIT') || text.includes('LAP DELETED') || (text.includes('TIME ') && text.includes(' DELETED'))) {
    return 'trackLimits';
  }

  if (text.includes('PENALTY')) return 'penalties';
  if (text.includes('BLACK AND WHITE FLAG') || flag === 'BLACK AND WHITE') return 'blackWhite';
  if (text.includes('NO FURTHER ACTION') || text.includes('NO FURTHER INVESTIGATION')) return 'incidents';
  if (text.includes('WILL BE INVESTIGATED') || text.includes('UNDER INVESTIGATION') || text.includes('INVESTIGATION')) return 'incidents';
  if (text.includes('INCIDENT') && text.includes('NOTED')) return 'incidents';
  if (text.includes('SAFETY CAR') || text.includes('VIRTUAL SAFETY CAR') || text.includes('VSC') || category === 'SAFETYCAR') return 'safetyCar';
  if (text.includes('OVERTAKE') || text.includes('DRS')) return 'drs';
  if (text.includes('PIT EXIT') || text.includes('PIT LANE') || text.includes('PIT ENTRY')) return 'pitLane';
  if (text.includes('TRACK SURFACE') || text.includes('SLIPPERY')) return 'trackSurface';
  if (text.includes('SESSION') || text.includes('WILL START') || text.includes('WILL RESUME') || text.includes('DELAYED') || text.includes('FIRST CAR TO TAKE THE FLAG') || text.includes('START OF')) return 'session';

  if (flag === 'YELLOW' || flag === 'DOUBLE YELLOW' || text.includes('YELLOW IN TRACK')) return 'yellow';
  if (flag === 'CLEAR' || text.includes('TRACK CLEAR') || text.includes('CLEAR IN TRACK')) return 'clear';
  if (flag === 'GREEN' || text.includes('GREEN LIGHT')) return 'green';
  if (flag === 'RED' || text.includes('RED FLAG')) return 'red';
  if (flag === 'BLUE' || text.includes('BLUE FLAG')) return 'blue';
  if (flag === 'CHEQUERED' || text.includes('CHEQUERED')) return 'chequered';

  return 'other';
}

export function raceControlLabel(message: RaceControlMessage, kind: RaceControlFilterId): string {
  if (message.flag) return message.flag;

  const filter = raceControlFilters.find((item) => item.id === kind);
  return filter?.label ?? (message.category || 'Info');
}

export function raceControlBadgeClass(kind: RaceControlFilterId): string {
  if (kind === 'yellow') return 'border-yellow-300/40 bg-yellow-400/15 text-yellow-200';
  if (kind === 'clear') return 'border-sky-400/40 bg-sky-500/15 text-sky-300';
  if (kind === 'green') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300';
  if (kind === 'red') return 'border-red-400/40 bg-red-500/15 text-red-300';
  if (kind === 'blue') return 'border-blue-400/40 bg-blue-500/15 text-blue-300';
  if (kind === 'blackWhite') return 'border-zinc-100/50 bg-zinc-100/15 text-zinc-100';
  if (kind === 'chequered') return 'border-zinc-200/50 bg-zinc-100/15 text-zinc-100';
  if (kind === 'safetyCar') return 'border-orange-300/50 bg-orange-400/15 text-orange-200';
  if (kind === 'trackLimits') return 'border-purple-300/40 bg-purple-500/15 text-purple-200';
  if (kind === 'incidents') return 'border-rose-300/40 bg-rose-500/15 text-rose-200';
  if (kind === 'penalties') return 'border-red-300/50 bg-red-500/20 text-red-200';
  if (kind === 'session') return 'border-cyan-300/40 bg-cyan-500/15 text-cyan-200';
  if (kind === 'pitLane') return 'border-lime-300/40 bg-lime-500/15 text-lime-200';
  if (kind === 'drs') return 'border-fuchsia-300/40 bg-fuchsia-500/15 text-fuchsia-200';
  if (kind === 'trackSurface') return 'border-amber-300/40 bg-amber-500/15 text-amber-200';

  return 'border-zinc-500/40 bg-zinc-700/30 text-zinc-300';
}

export function raceControlAccentClass(kind: RaceControlFilterId): string {
  if (kind === 'yellow') return 'border-l-yellow-300';
  if (kind === 'clear') return 'border-l-sky-400';
  if (kind === 'green') return 'border-l-emerald-400';
  if (kind === 'red') return 'border-l-red-400';
  if (kind === 'blue') return 'border-l-blue-400';
  if (kind === 'blackWhite') return 'border-l-zinc-100';
  if (kind === 'chequered') return 'border-l-zinc-300';
  if (kind === 'safetyCar') return 'border-l-orange-300';
  if (kind === 'trackLimits') return 'border-l-purple-300';
  if (kind === 'incidents') return 'border-l-rose-300';
  if (kind === 'penalties') return 'border-l-red-300';
  if (kind === 'session') return 'border-l-cyan-300';
  if (kind === 'pitLane') return 'border-l-lime-300';
  if (kind === 'drs') return 'border-l-fuchsia-300';
  if (kind === 'trackSurface') return 'border-l-amber-300';

  return 'border-l-zinc-700';
}
