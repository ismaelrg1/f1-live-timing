<script lang="ts">
  import DashboardHeader from '../lib/components/dashboard/DashboardHeader.svelte';
  import DriverTable from '../lib/components/driver-table/DriverTable.svelte';
  import { defaultMockScenario, mockScenarios } from '../lib/data/mockScenarios';
  import { visibleColumns } from '../lib/stores/columnsStore';

  let activeScenarioId = $state(defaultMockScenario.id);

  let activeScenario = $derived.by(() => {
    return mockScenarios.find((scenario) => scenario.id === activeScenarioId) ?? defaultMockScenario;
  });
</script>

<svelte:head>
  <title>F1 Live Dashboard</title>
</svelte:head>

<section class="min-h-screen bg-zinc-950 p-2 text-zinc-100 sm:p-3">
  <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
    <div class="min-w-0">
      <p class="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
        Mock scenario
      </p>
      <p class="truncate text-xs font-semibold text-zinc-400">
        {activeScenario.description}
      </p>
    </div>

    <label
      class="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-500"
    >
      <span>Scenario</span>
      <select
        bind:value={activeScenarioId}
        class="h-8 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-bold normal-case tracking-normal text-zinc-100 outline-none focus:border-sky-500"
      >
        {#each mockScenarios as scenario}
          <option value={scenario.id}>{scenario.label}</option>
        {/each}
      </select>
    </label>
  </div>

  <DashboardHeader session={activeScenario.session} />

  <DriverTable
    session={activeScenario.session}
    drivers={activeScenario.drivers}
    columns={$visibleColumns}
  />
</section>
