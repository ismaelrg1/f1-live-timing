<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import DriverTableCell from './DriverTableCell.svelte';

  interface Props {
    driver: DriverRow;
    columns: ColumnDefinition[];
    isDimmed?: boolean;
    isCutoffWarning?: boolean;
  }

  let { driver, columns, isDimmed = false, isCutoffWarning = false }: Props = $props();
  let rowElement: HTMLTableRowElement;
  let previousRect: DOMRect | null = null;

  function alignClass(align: ColumnDefinition['align']) {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }

  $effect.pre(() => {
    driver.position;
    previousRect = rowElement?.getBoundingClientRect() ?? null;
  });

  $effect(() => {
    driver.position;

    if (!rowElement || !previousRect) return;

    const nextRect = rowElement.getBoundingClientRect();
    const deltaY = previousRect.top - nextRect.top;

    if (Math.abs(deltaY) < 1) return;

    rowElement.animate(
      [
        { transform: `translateY(${deltaY}px)` },
        { transform: 'translateY(0)' }
      ],
      {
        duration: 300,
        easing: 'cubic-bezier(0.2, 0, 0, 1)'
      }
    );
  });
</script>

<tr
  bind:this={rowElement}
  class={[
    'border-t border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/60',
    isDimmed && 'opacity-45 grayscale',
    isCutoffWarning && 'bg-yellow-400/10 shadow-[inset_3px_0_0_rgb(250_204_21)]'
  ]}
>
  {#each columns as column}
    <td
      class={[
        'border-r border-zinc-800 px-2 py-0.5 text-xs last:border-r-0',
        alignClass(column.align)
      ]}
      style={column.width ? `width: ${column.width}` : undefined}
    >
      <DriverTableCell {driver} {column} />
    </td>
  {/each}
</tr>
