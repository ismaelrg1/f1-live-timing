<script lang="ts">
  import Activity from 'lucide-svelte/icons/activity';
  import Clock from 'lucide-svelte/icons/clock';
  import CloudRain from 'lucide-svelte/icons/cloud-rain';
  import Droplets from 'lucide-svelte/icons/droplets';
  import Gauge from 'lucide-svelte/icons/gauge';
  import MapPin from 'lucide-svelte/icons/map-pin';
  import Thermometer from 'lucide-svelte/icons/thermometer';
  import Timer from 'lucide-svelte/icons/timer';
  import Wind from 'lucide-svelte/icons/wind';

  import type { DashboardSessionState } from '../../types/dashboard';
  import TrackStatusBadge from '../timing/TrackStatusBadge.svelte';

  interface Props {
    session: DashboardSessionState;
  }

  let { session }: Props = $props();

  let sessionTypeLabel = $derived.by(() => {
    const type = session.sessionType.toLowerCase();

    if (type.includes('race')) return 'Race';
    if (type.includes('qual')) return session.qualifyingPartLabel ?? 'Qualifying';
    if (type.includes('practice')) return 'Practice';

    return session.sessionName;
  });

  let isRaceSession = $derived.by(() => {
    return session.sessionType.toLowerCase().includes('race');
  });

  let lapMainLabel = $derived.by(() => {
    if (session.currentLap === null) return '-';
    if (session.totalLaps === null) return String(session.currentLap);

    return `${session.currentLap} / ${session.totalLaps}`;
  });

  let lapSubLabel = $derived.by(() => {
    if (session.remainingLaps === null) return 'LAP';
    return `${session.remainingLaps} TO GO`;
  });

  let sessionStatusLabel = $derived.by(() => {
    if (session.sessionStatus.toLowerCase() === 'started') return 'LIVE';
    return session.sessionStatus.toUpperCase();
  });

  let rainfallLabel = $derived.by(() => {
    return session.weather.rainfall === '1' ? 'YES' : `${session.weather.rainfall} mm`;
  });
</script>

<header
  class="mb-4 overflow-hidden rounded border border-zinc-800 bg-[#070d1a] shadow-lg shadow-black/20"
>
  <div class="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
    <div class="flex min-w-0 flex-wrap items-center gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="truncate text-xl font-black leading-tight text-zinc-100">
            {session.meetingName}
          </h1>

          <span class="hidden text-lg leading-none text-zinc-500 sm:inline">·</span>

          <span class="hidden text-sm font-black uppercase tracking-wide text-zinc-200 sm:inline">
            {sessionTypeLabel}
          </span>
        </div>

        <div class="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
          <span>{sessionTypeLabel}</span>
          <span class="h-1 w-1 rounded-full bg-zinc-700"></span>
          <MapPin size={11} strokeWidth={2.4} />
          <span class="truncate">{session.circuitName}</span>
        </div>
      </div>

      <div class="hidden h-8 w-px bg-zinc-800 lg:block"></div>

      <div class="flex flex-wrap items-center gap-2">
        <div class="inline-flex h-8 items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 text-[11px] font-black text-red-300">
          <Clock size={13} strokeWidth={2.4} />
          <span>{session.clockRemaining || '-'}</span>
        </div>

        <div class="inline-flex h-8 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[11px] font-black text-zinc-400">
          <Activity
            size={13}
            strokeWidth={2.4}
            class={session.clockRunning ? 'text-emerald-400' : 'text-zinc-500'}
          />
          <span>{sessionStatusLabel}</span>
        </div>

        <TrackStatusBadge
          code={session.trackStatusCode}
          message={session.trackStatusMessage}
        />
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
      {#if isRaceSession}
        <div class="min-w-20 rounded border border-zinc-800 bg-zinc-950/70 px-3 py-2">
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <Timer size={11} strokeWidth={2.4} />
            <span>Laps</span>
          </div>
          <div class="mt-0.5 flex items-baseline gap-1">
            <strong class="text-lg font-black tabular-nums text-zinc-100">{lapMainLabel}</strong>
            <span class="text-[9px] font-black uppercase text-zinc-500">{lapSubLabel}</span>
          </div>
        </div>
      {/if}

      <div class="grid flex-1 grid-cols-2 gap-2 rounded border border-zinc-800 bg-zinc-950/70 px-3 py-2 sm:flex sm:flex-none sm:items-center sm:gap-4">
        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-sky-400">
            <Thermometer size={11} strokeWidth={2.4} />
            <span>Air</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{session.weather.airTemp}°</strong>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-orange-400">
            <Thermometer size={11} strokeWidth={2.4} />
            <span>Track</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{session.weather.trackTemp}°</strong>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-cyan-400">
            <Droplets size={11} strokeWidth={2.4} />
            <span>Hum</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{session.weather.humidity}%</strong>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <Wind size={11} strokeWidth={2.4} />
            <span>Wind</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{session.weather.windSpeed}</strong>
          <span class="ml-0.5 text-[10px] font-bold text-zinc-500">m/s</span>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-violet-400">
            <Gauge size={11} strokeWidth={2.4} />
            <span>Press</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{session.weather.pressure}</strong>
        </div>

        <div>
          <div class="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-zinc-500">
            <CloudRain size={11} strokeWidth={2.4} />
            <span>Rain</span>
          </div>
          <strong class="text-sm font-black tabular-nums text-zinc-100">{rainfallLabel}</strong>
        </div>
      </div>
    </div>
  </div>
</header>
