<script lang="ts">
  import type { DriverRow } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();

  let letter = $derived.by(() => {
    if (driver.compound === 'SOFT') return 'S';
    if (driver.compound === 'MEDIUM') return 'M';
    if (driver.compound === 'HARD') return 'H';
    if (driver.compound === 'INTERMEDIATE') return 'I';
    if (driver.compound === 'WET') return 'W';
    return '?';
  });

  let compoundName = $derived.by(() => {
    if (driver.compound === 'SOFT') return 'Soft';
    if (driver.compound === 'MEDIUM') return 'Medium';
    if (driver.compound === 'HARD') return 'Hard';
    if (driver.compound === 'INTERMEDIATE') return 'Intermediate';
    if (driver.compound === 'WET') return 'Wet';
    return 'Unknown';
  });

  let tyreColor = $derived.by(() => {
    if (driver.compound === 'SOFT') return 'bg-red-500 text-white ring-red-300/40';
    if (driver.compound === 'MEDIUM') return 'bg-yellow-300 text-zinc-950 ring-yellow-100/50';
    if (driver.compound === 'HARD') return 'bg-zinc-100 text-zinc-950 ring-white/60';
    if (driver.compound === 'INTERMEDIATE') return 'bg-emerald-500 text-white ring-emerald-300/40';
    if (driver.compound === 'WET') return 'bg-blue-500 text-white ring-blue-300/40';
    return 'bg-zinc-700 text-zinc-200 ring-zinc-500/40';
  });
</script>

<div
  class="inline-flex items-center gap-1.5"
  title={`${compoundName}, ${driver.tyreLaps} total laps, ${driver.stintLaps} in this stint${driver.isNewTyre ? ', new tyre' : ', used tyre'}`}
>
  <span
    class={[
      'relative inline-flex size-6 items-center justify-center rounded-full text-[11px] font-black leading-none ring-2',
      tyreColor,
      driver.isNewTyre && 'shadow-[0_0_0_2px_rgba(255,255,255,0.28)]'
    ]}
  >
    {letter}

    {#if driver.isNewTyre}
      <span
        class="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-white ring-2 ring-zinc-900"
        title="New tyre"
      ></span>
    {/if}
  </span>

  <span class="text-xs font-semibold tabular-nums text-zinc-300">
    {driver.tyreLaps}
  </span>
</div>
