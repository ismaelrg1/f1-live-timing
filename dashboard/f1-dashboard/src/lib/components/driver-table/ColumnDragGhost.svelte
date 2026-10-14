<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import DriverTableCell from './DriverTableCell.svelte';

  interface Props {
    column: ColumnDefinition;
    drivers: DriverRow[];
    x: number;
    y: number;
    width: number;
  }

  let { column, drivers, x, y, width }: Props = $props();

  function alignClass(align: ColumnDefinition['align']) {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }
</script>

<div
  class="pointer-events-none fixed z-50 overflow-hidden rounded border border-emerald-400/40 bg-zinc-950/95 shadow-2xl shadow-black/50 ring-1 ring-white/10"
  style={`left: ${x}px; top: ${y}px; width: ${width}px;`}
>
  <div
    class={[
      'border-b border-zinc-800 bg-zinc-900 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-emerald-300',
      alignClass(column.align)
    ]}
  >
    {column.label}
  </div>

  {#each drivers as driver (driver.racingNumber)}
    <div
      class={[
        'border-b border-zinc-800 px-3 py-2 text-sm last:border-b-0',
        alignClass(column.align)
      ]}
    >
      <DriverTableCell {driver} {column} />
    </div>
  {/each}
</div>
