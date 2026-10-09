<script lang="ts">
  import type { DriverRow, MiniSectorStatus } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();

  function miniSectorClass(status: MiniSectorStatus) {
    if (status === 2051) return 'bg-purple-500';
    if (status === 2049) return 'bg-emerald-400';
    if (status === 2050) return 'bg-yellow-400';
    if (status === 2052) return 'bg-orange-400';
    if (status === 2048) return 'bg-zinc-600';
    if (status === 2064) return 'bg-zinc-700';
    return 'bg-zinc-800';
  }

  function sectorTextClass(personalFastest: boolean, overallFastest: boolean) {
    if (overallFastest) return 'text-purple-400';
    if (personalFastest) return 'text-emerald-400';
    return 'text-zinc-300';
  }
</script>

<div class="grid min-w-[250px] grid-cols-3 gap-2.5">
  {#each driver.sectors as sector}
    <div class="min-w-0">
      <div class="flex min-h-2 items-center gap-0.5">
        {#each sector.segments as segment}
          <span
            class={[
              'h-1.5 min-w-2 flex-1 rounded-sm',
              miniSectorClass(segment.status)
            ]}
            title={`Mini sector ${segment.index}: ${segment.status}`}
          ></span>
        {/each}
      </div>

      <div class="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-bold tabular-nums">
        <span class={sectorTextClass(sector.personalFastest, sector.overallFastest)}>
          {sector.value || '-'}
        </span>

        <span class="text-zinc-500">
          {driver.bestSectors[sector.index]?.value || '-'}
        </span>
      </div>
    </div>
  {/each}
</div>
