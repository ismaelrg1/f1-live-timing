<script lang="ts">
  import { columnState } from '../../stores/columnsStore';
  import { driverColumns, type DriverColumnId } from '../../types/columns';

  let open = $state(false);

  function labelFor(id: DriverColumnId) {
    return driverColumns.find((column) => column.id === id)?.label ?? id;
  }

  let visibleCount = $derived($columnState.filter((column) => column.visible).length);
</script>

<div class="relative">
  <button
    type="button"
    class="grid size-7 place-items-center rounded border border-zinc-700/50 bg-zinc-950/55 text-sm text-zinc-500 opacity-60 shadow-lg transition hover:border-zinc-500 hover:bg-zinc-900/90 hover:text-zinc-100 hover:opacity-100"
    onclick={() => (open = !open)}
    title="Columns"
  >
    ⚙
  </button>

  {#if open}
    <div
      class="absolute right-0 z-50 mt-2 w-56 rounded border border-zinc-700 bg-zinc-950 p-2 shadow-xl"
    >
      <div class="mb-2 flex items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <span class="text-xs font-black uppercase tracking-wide text-zinc-400">
          Visible columns
        </span>

        <button
          type="button"
          class="text-xs font-bold text-zinc-500 hover:text-zinc-200"
          onclick={() => columnState.resetColumns()}
        >
          Reset
        </button>
      </div>

      <div class="flex flex-col gap-1">
        {#each $columnState as column}
          {@const isLastVisibleColumn = column.visible && visibleCount <= 1}
          <label
            class={[
              'flex items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900',
              isLastVisibleColumn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            ]}
            title={isLastVisibleColumn ? 'At least one column must remain visible' : undefined}
          >
            <input
              type="checkbox"
              checked={column.visible}
              disabled={isLastVisibleColumn}
              onchange={() => columnState.toggleColumn(column.id)}
              class="rounded border-zinc-600 bg-zinc-900 text-emerald-500"
            />

            <span>{labelFor(column.id)}</span>
          </label>
        {/each}
      </div>
    </div>
  {/if}
</div>
