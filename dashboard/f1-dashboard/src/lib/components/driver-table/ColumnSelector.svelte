<script lang="ts">
  import { columnState } from '../../stores/columnsStore';
  import { driverColumns, type DriverColumnId } from '../../types/columns';

  function getColumnLabel(id: DriverColumnId) {
    return driverColumns.find((column) => column.id === id)?.label ?? id;
  }
</script>

<section class="rounded border border-zinc-800 bg-zinc-900 p-3">
  <div class="mb-3 flex items-center justify-between gap-3">
    <h2 class="text-sm font-black uppercase tracking-wide text-zinc-300">
      Columns
    </h2>

    <button
      type="button"
      class="rounded bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
      onclick={() => columnState.resetColumns()}
    >
      Reset
    </button>
  </div>

  <div class="flex flex-wrap gap-2">
    {#each $columnState as setting}
      <div class="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1">
        <label class="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <input
            type="checkbox"
            checked={setting.visible}
            onchange={() => columnState.toggleColumn(setting.id)}
            class="rounded border-zinc-600 bg-zinc-900 text-emerald-500"
          />

          <span>{getColumnLabel(setting.id)}</span>
        </label>
      </div>
    {/each}
  </div>
</section>
