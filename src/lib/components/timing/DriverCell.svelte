<script lang="ts">
  import GridDelta from './GridDelta.svelte';
  import type { DriverRow } from '../../types/dashboard';

  interface Props {
    driver: DriverRow;
  }

  let { driver }: Props = $props();
</script>

<div class="flex min-w-48 items-center gap-2">
  <span
    class="h-7 w-1.5 shrink-0 rounded-sm"
    style={`background-color: #${driver.teamColour}`}
    title={driver.team}
  ></span>

  <span class="w-5 shrink-0 text-right text-xs font-black tabular-nums text-zinc-100">
    {driver.position}
  </span>

  <div class="min-w-0">
    <div class="flex items-center gap-2">
      <strong class="text-xs font-black tracking-wide text-zinc-100">
        {driver.tla}
      </strong>

      <span class="text-[11px] font-semibold tabular-nums text-zinc-500">
        #{driver.racingNumber}
      </span>
    </div>

    <div class="flex min-w-0 items-center gap-2">
      <span class="truncate text-[11px] font-medium text-zinc-400">
        {driver.driverName}
      </span>

      <GridDelta value={driver.gridDelta} />
    </div>
  </div>
</div>
