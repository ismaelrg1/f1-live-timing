<script lang="ts">
  import { columnState } from '../../stores/columnsStore';
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow, TrackStatusCode  } from '../../types/dashboard';

  import ColumnDragGhost from './ColumnDragGhost.svelte';
  import ColumnMenu from './ColumnMenu.svelte';
  import DriverTableHeader from './DriverTableHeader.svelte';
  import DriverTableRow from './DriverTableRow.svelte';

  interface Props {
    drivers: DriverRow[];
    columns: ColumnDefinition[];
    trackStatusCode?: TrackStatusCode;
  }

  let { drivers, columns, trackStatusCode = '1' }: Props = $props();

  let previewColumns = $state<ColumnDefinition[] | null>(null);
  let dragGhost = $state<{
    column: ColumnDefinition;
    x: number;
    y: number;
    width: number;
  } | null>(null);

  let trackAlertClass = $derived.by(() => {
    if (trackStatusCode === '5') return 'track-alert-red';
    if (['2', '4', '6', '7'].includes(trackStatusCode)) return 'track-alert-yellow';
    return '';
  });

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

<section class={["relative w-full rounded border border-zinc-800 bg-zinc-900", trackAlertClass]}>
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

<style>
  @keyframes yellow-table-pulse {
    0%, 100% {
      box-shadow: 0 0 0 1px rgb(250 204 21 / 0.2);
    }

    50% {
      box-shadow: 0 0 0 2px rgb(250 204 21 / 0.75), 0 0 28px rgb(250 204 21 / 0.18);
    }
  }

  @keyframes red-table-pulse {
    0%, 100% {
      box-shadow: 0 0 0 1px rgb(239 68 68 / 0.25);
    }

    50% {
      box-shadow: 0 0 0 2px rgb(239 68 68 / 0.8), 0 0 32px rgb(239 68 68 / 0.24);
    }
  }

  .track-alert-yellow {
    animation: yellow-table-pulse 1.4s ease-in-out infinite;
  }

  .track-alert-red {
    animation: red-table-pulse 1.1s ease-in-out infinite;
  }
</style>
