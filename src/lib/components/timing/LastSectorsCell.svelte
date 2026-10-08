<script lang="ts">
  import type { DriverRow } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();

  let sectorValues = $derived.by(() => {
    return driver.lastLapSectors.map((sector) => ({
      ...sector,
      value: sector.value || '-'
    }));
  });

  function sectorClass(personalFastest: boolean, overallFastest: boolean) {
    if (overallFastest) return 'text-purple-400';
    if (personalFastest) return 'text-emerald-400';
    return 'text-zinc-300';
  }
</script>

<div class="grid min-w-44 grid-cols-3 gap-2 text-center text-xs font-bold tabular-nums">
  {#each sectorValues as sector}
    <span
      class={sectorClass(sector.personalFastest, sector.overallFastest)}
      title={`Sector ${sector.index + 1}`}
    >
      {sector.value}
    </span>
  {/each}
</div>
