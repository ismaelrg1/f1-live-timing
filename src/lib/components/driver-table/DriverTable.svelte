<script lang="ts">
  import { columnState } from '../../stores/columnsStore';
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import ColumnDragGhost from './ColumnDragGhost.svelte';
  import ColumnMenu from './ColumnMenu.svelte';
  import DriverTableHeader from './DriverTableHeader.svelte';
  import DriverTableRow from './DriverTableRow.svelte';

  interface Props {
    drivers: DriverRow[];
    columns: ColumnDefinition[];
  }

  let { drivers, columns }: Props = $props();

  let previewColumns = $state<ColumnDefinition[] | null>(null);
  let dragGhost = $state<{
    column: ColumnDefinition;
    x: number;
    y: number;
    width: number;
  } | null>(null);

  let displayedColumns = $derived(previewColumns ?? columns);

  function handlePreviewColumns(nextColumns: ColumnDefinition[]) {
    previewColumns = nextColumns;
  }

  function handleCommitColumns(nextColumns: ColumnDefinition[]) {
    columnState.setVisibleColumnOrder(nextColumns.map((column) => column.id));
    previewColumns = null;
  }

  function handleGhostChange(
    ghost: { column: ColumnDefinition; x: number; y: number; width: number } | null
  ) {
    dragGhost = ghost;

    if (!ghost) {
      previewColumns = null;
    }
  }
</script>

<section class="relative w-full rounded border border-zinc-800 bg-zinc-900">
  <div class="absolute right-2 top-2 z-30">
    <ColumnMenu />
  </div>

  <div class="overflow-x-auto rounded">
    <table class="w-full border-collapse">
      <DriverTableHeader
        columns={displayedColumns}
        onPreviewColumns={handlePreviewColumns}
        onCommitColumns={handleCommitColumns}
        onGhostChange={handleGhostChange}
      />

      <tbody>
        {#each drivers as driver (driver.racingNumber)}
          <DriverTableRow {driver} columns={displayedColumns} />
        {/each}
      </tbody>
    </table>
  </div>

  {#if dragGhost}
    <ColumnDragGhost
      column={dragGhost.column}
      {drivers}
      x={dragGhost.x}
      y={dragGhost.y}
      width={dragGhost.width}
    />
  {/if}
</section>
