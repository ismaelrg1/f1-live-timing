<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';

  interface Props {
    columns: ColumnDefinition[];
  }

  let { columns }: Props = $props();

  function alignClass(align: ColumnDefinition['align']) {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }
</script>

<thead class="bg-zinc-950/80">
  <tr>
    {#each columns as column}
      <th
        class={[
          'border-r border-zinc-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-zinc-500 last:border-r-0',
          alignClass(column.align)
        ]}
        style={column.width ? `width: ${column.width}` : undefined}
      >
        {column.label}
      </th>
    {/each}
  </tr>
</thead>