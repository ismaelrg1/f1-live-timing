<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import DriverTableCell from './DriverTableCell.svelte';

  interface Props {
    driver: DriverRow;
    columns: ColumnDefinition[];
  }

  let { driver, columns }: Props = $props();

  function alignClass(align: ColumnDefinition['align']) {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }

</script>

<tr class="border-t border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800/60">
  {#each columns as column}
    <td
      class={[
        'border-r border-zinc-800 px-3 py-2 text-sm last:border-r-0',
        alignClass(column.align)
      ]}
      style={column.width ? `width: ${column.width}` : undefined}
    >
      <DriverTableCell {driver} {column} />
    </td>
  {/each}
</tr>
