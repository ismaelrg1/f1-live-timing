<script lang="ts">
  import type { RaceControlMessage } from '../../types/raceControl';
  import {
    raceControlAccentClass,
    raceControlBadgeClass,
    raceControlKind,
    raceControlLabel,
    type RaceControlFilterId
  } from './raceControlFilters';

  interface Props {
    message: RaceControlMessage;
    kind?: RaceControlFilterId;
  }

  let { message, kind = raceControlKind(message) }: Props = $props();

  function formatTime(value: string) {
    if (!value) return '-';

    const normalizedValue = value.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(value)
      ? value
      : `${value}Z`;
    const date = new Date(normalizedValue);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  let badgeText = $derived(raceControlLabel(message, kind));
</script>

<div
  class={[
    'grid grid-cols-[4rem_3rem_7.5rem_minmax(0,1fr)] items-center gap-3 border-b border-l-2 border-b-zinc-800/80 px-3 py-2.5 transition hover:bg-zinc-900/70 last:border-b-0',
    raceControlAccentClass(kind)
  ]}
>
  <span class="text-[10px] font-bold tabular-nums leading-tight text-zinc-500">
    {formatTime(message.utc)}
  </span>

  <span class="text-center text-[10px] font-black tabular-nums text-zinc-500">
    {message.lap ? `L${message.lap}` : '-'}
  </span>

  <span
    class={[
      'inline-flex w-fit min-w-16 justify-center rounded border px-2 py-1 text-[10px] font-black uppercase',
      raceControlBadgeClass(kind)
    ]}
  >
    {badgeText}
  </span>

  <div class="min-w-0">
    <p class="truncate text-xs font-black text-zinc-200">
      {message.message || '-'}
    </p>

    <p class="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-zinc-600">
      {#if message.driverTla}
        {message.driverTla}
      {:else if message.racingNumber}
        #{message.racingNumber}
      {:else}
        Race control
      {/if}

      {#if message.sector}
        · Sector {message.sector}
      {/if}

      {#if message.status}
        · {message.status}
      {/if}
    </p>
  </div>
</div>
