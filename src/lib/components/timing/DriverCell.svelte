<script lang="ts">
  import GridDelta from './GridDelta.svelte';
  import type { DriverRow } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();
</script>

<div class="flex min-w-52 items-center gap-3">
  <span
    class="h-10 w-1.5 shrink-0 rounded-sm"
    style={`background-color: #${driver.teamColour}`}
    title={driver.team}
  ></span>

  <span class="w-6 shrink-0 text-right text-sm font-black tabular-nums text-zinc-100">
    {driver.position}
  </span>

  <div class="min-w-0">
    <div class="flex items-center gap-2">
      <strong class="text-sm font-black tracking-wide text-zinc-100">
        {driver.tla}
      </strong>

      <span class="text-xs font-semibold tabular-nums text-zinc-500">
        #{driver.racingNumber}
      </span>
    </div>

    <div class="mt-0.5 flex min-w-0 items-center gap-2">
      <span class="truncate text-xs font-medium text-zinc-400">
        {driver.driverName}
      </span>

      <GridDelta value={driver.gridDelta} />
    </div>
  </div>
</div>