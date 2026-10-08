<script lang="ts">
  import type { ColumnDefinition } from '../../types/columns';
  import type { DriverRow } from '../../types/dashboard';

  import DriverTableHeader from './DriverTableHeader.svelte';
  import DriverTableRow from './DriverTableRow.svelte';

  interface Props {
    drivers: DriverRow[];
    columns: ColumnDefinition[];
  }

  let { drivers, columns }: Props = $props();
</script>

<section class="overflow-hidden rounded border border-zinc-800 bg-zinc-900">
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
      <DriverTableHeader {columns} />

      <tbody>
        {#each drivers as driver (driver.racingNumber)}
          <DriverTableRow {driver} {columns} />
        {/each}
      </tbody>
    </table>
  </div>
</section>