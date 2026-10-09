<script lang="ts">
  import type { Compound, DriverRow, Stint } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();

  interface StintSegment {
    stint: Stint;
    left: number;
    width: number;
    center: number;
    showLapCount: boolean;
  }

  let visibleStints = $derived.by(() => {
    return driver.stints.filter((stint) => stint.totalLaps > 0);
  });

  let totalTimelineLaps = $derived.by(() => {
    const stintTotal = visibleStints.reduce((total, stint) => total + stint.totalLaps, 0);

    return Math.max(stintTotal, driver.laps, 1);
  });

  let stintSegments = $derived.by<StintSegment[]>(() => {
    let elapsedLaps = 0;

    return visibleStints.map((stint) => {
      const left = (elapsedLaps / totalTimelineLaps) * 100;
      const width = (stint.totalLaps / totalTimelineLaps) * 100;
      const center = left + width / 2;

      elapsedLaps += stint.totalLaps;

      return {
        stint,
        left,
        width: Math.max(0, width),
        center,
        showLapCount: stint.totalLaps > 1 && width >= 6
      };
    });
  });

  function compoundLetter(compound: Compound) {
    if (compound === 'SOFT') return 'S';
    if (compound === 'MEDIUM') return 'M';
    if (compound === 'HARD') return 'H';
    if (compound === 'INTERMEDIATE') return 'I';
    if (compound === 'WET') return 'W';
    return '?';
  }

  function compoundTitle(compound: Compound) {
    if (compound === 'SOFT') return 'Soft';
    if (compound === 'MEDIUM') return 'Medium';
    if (compound === 'HARD') return 'Hard';
    if (compound === 'INTERMEDIATE') return 'Intermediate';
    if (compound === 'WET') return 'Wet';
    return 'Unknown';
  }

  function compoundDotClass(compound: Compound) {
    if (compound === 'SOFT') return 'border-red-400 bg-zinc-950 text-red-300';
    if (compound === 'MEDIUM') return 'border-yellow-300 bg-zinc-950 text-yellow-200';
    if (compound === 'HARD') return 'border-zinc-100 bg-zinc-950 text-zinc-100';
    if (compound === 'INTERMEDIATE') return 'border-emerald-400 bg-zinc-950 text-emerald-300';
    if (compound === 'WET') return 'border-blue-400 bg-zinc-950 text-blue-300';
    return 'border-zinc-500 bg-zinc-950 text-zinc-400';
  }

  function compoundLineClass(compound: Compound) {
    if (compound === 'SOFT') return 'bg-red-500';
    if (compound === 'MEDIUM') return 'bg-yellow-300';
    if (compound === 'HARD') return 'bg-zinc-100';
    if (compound === 'INTERMEDIATE') return 'bg-emerald-500';
    if (compound === 'WET') return 'bg-blue-500';
    return 'bg-zinc-600';
  }

  function stintTitle(stint: Stint) {
    const tyreState = stint.new ? 'new' : 'used';

    return `${compoundTitle(stint.compound)}, ${stint.totalLaps} laps, ${tyreState} tyre`;
  }
</script>

{#if visibleStints.length > 0}
  <div class="relative h-8 min-w-[360px] px-3" title={`${driver.tla} tyre stints`}>
    <div class="absolute inset-x-3 top-0 h-full">
      <div class="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-zinc-800"></div>

      {#each stintSegments as segment (segment.stint.index)}
        <div
          class={[
            'absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full',
            compoundLineClass(segment.stint.compound)
          ]}
          style={`left: ${segment.left}%; width: ${segment.width}%;`}
          title={stintTitle(segment.stint)}
        ></div>

        <span
          class={[
            'absolute top-1/2 z-10 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-[10px] font-black leading-none shadow-sm shadow-black/50',
            compoundDotClass(segment.stint.compound)
          ]}
          style={`left: ${segment.left}%;`}
          title={stintTitle(segment.stint)}
        >
          {compoundLetter(segment.stint.compound)}
        </span>

        {#if segment.showLapCount}
          <span
            class={[
              'absolute top-1/2 z-20 min-w-5 -translate-x-1/2 -translate-y-1/2 rounded-full px-1 text-center text-[10px] font-black leading-4 text-zinc-950 shadow-sm shadow-black/30',
              compoundLineClass(segment.stint.compound)
            ]}
            style={`left: ${segment.center}%;`}
            title={stintTitle(segment.stint)}
          >
            {segment.stint.totalLaps}
          </span>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <span class="text-zinc-600">-</span>
{/if}
