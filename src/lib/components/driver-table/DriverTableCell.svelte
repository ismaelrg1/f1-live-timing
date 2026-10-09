<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import DriverCell from '../timing/DriverCell.svelte';
  import LastSectorsCell from '../timing/LastSectorsCell.svelte';
  import PitStateBadge from '../timing/PitStateBadge.svelte';
  import SectorBoard from '../timing/SectorBoard.svelte';
  import TyreBadge from '../timing/TyreBadge.svelte';

  interface Props {
    driver: DriverRow;
    column: ColumnDefinition;
  }

  let { driver, column }: Props = $props();

  function lapClass(personalFastest: boolean, overallFastest: boolean) {
    if (overallFastest) return 'text-purple-400';
    if (personalFastest) return 'text-emerald-400';
    return 'text-zinc-100';
  }
</script>

{#if column.id === 'status'}
  <PitStateBadge {driver} />

{:else if column.id === 'driver'}
  <DriverCell {driver} />

{:else if column.id === 'tyres'}
  <TyreBadge {driver} />

{:else if column.id === 'bestLap'}
  <span class="font-semibold tabular-nums text-zinc-100">
    {driver.bestLap || '-'}
  </span>

{:else if column.id === 'gapToLeader'}
  <span class="font-semibold tabular-nums text-zinc-100">
    {driver.position === '1' ? 'LEADER' : driver.gapToLeader || '-'}
  </span>

{:else if column.id === 'intervalToAhead'}
  <span class="font-semibold tabular-nums text-zinc-100">
    {driver.intervalToAhead || '-'}
  </span>

{:else if column.id === 'lastLap'}
  <span
    class={[
      'font-semibold tabular-nums',
      lapClass(driver.lastLapPersonalBest, driver.lastLapOverallBest)
    ]}
  >
    {driver.lastLap || '-'}
  </span>

{:else if column.id === 'sectors'}
  <SectorBoard {driver} />

{:else if column.id === 'lastSectors'}
  <LastSectorsCell {driver} />

{:else if column.id === 'laps'}
  <span class="font-semibold tabular-nums text-zinc-100">
    {driver.laps}
  </span>

{:else}
  <span class="text-zinc-600">-</span>
{/if}
