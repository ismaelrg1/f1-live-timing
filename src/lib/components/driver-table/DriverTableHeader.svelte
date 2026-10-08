<script lang="ts">
  import type { ColumnDefinition, DriverColumnId } from '../../types/columns';

  interface DragGhostState {
    column: ColumnDefinition;
    x: number;
    y: number;
    width: number;
  }

  interface Props {
    columns: ColumnDefinition[];
    onPreviewColumns?: (columns: ColumnDefinition[]) => void;
    onCommitColumns?: (columns: ColumnDefinition[]) => void;
    onGhostChange?: (ghost: DragGhostState | null) => void;
  }

  let {
    columns,
    onPreviewColumns = () => {},
    onCommitColumns = () => {},
    onGhostChange = () => {}
  }: Props = $props();

  let draggedColumnId = $state<DriverColumnId | null>(null);
  let targetColumnId = $state<DriverColumnId | null>(null);
  let startX = 0;
  let startY = 0;
  let pointerOffsetX = 0;
  let pointerOffsetY = 0;
  let dragStarted = $state(false);
  let ghostWidth = 0;
  let lastPreviewTargetId: DriverColumnId | null = null;
  let dragBaseColumns: ColumnDefinition[] = [];
  let latestPreviewColumns: ColumnDefinition[] = [];

  function alignClass(align: ColumnDefinition['align']) {
    if (align === 'right') return 'text-right';
    if (align === 'center') return 'text-center';
    return 'text-left';
  }

  function reorderedColumns(draggedId: DriverColumnId, targetId: DriverColumnId) {
    const baseColumns = dragBaseColumns.length ? dragBaseColumns : columns;
    const draggedIndex = baseColumns.findIndex((column) => column.id === draggedId);
    const targetIndex = baseColumns.findIndex((column) => column.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      return latestPreviewColumns.length ? latestPreviewColumns : baseColumns;
    }

    const next = [...baseColumns];
    const [draggedColumn] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, draggedColumn);

    return next;
  }

  function columnAtPointer(clientX: number) {
    const elements = document.querySelectorAll<HTMLElement>('[data-driver-column-id]');

    for (const element of elements) {
      const rect = element.getBoundingClientRect();

      if (clientX >= rect.left && clientX <= rect.right) {
        return element.dataset.driverColumnId as DriverColumnId | undefined;
      }
    }
  }

  function cleanupDrag() {
    draggedColumnId = null;
    targetColumnId = null;
    dragStarted = false;
    ghostWidth = 0;
    lastPreviewTargetId = null;
    dragBaseColumns = [];
    latestPreviewColumns = [];
    onGhostChange(null);
  }

  function handlePointerDown(event: PointerEvent, column: ColumnDefinition) {
    if (event.button !== 0) return;

    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();

    startX = event.clientX;
    startY = event.clientY;
    pointerOffsetX = event.clientX - rect.left;
    pointerOffsetY = event.clientY - rect.top;
    ghostWidth = rect.width;
    draggedColumnId = column.id;
    targetColumnId = column.id;
    lastPreviewTargetId = column.id;
    dragBaseColumns = columns;
    latestPreviewColumns = columns;

    element.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!draggedColumnId) return;

    const distance = Math.hypot(event.clientX - startX, event.clientY - startY);

    if (!dragStarted && distance < 4) return;
    dragStarted = true;

    const draggedColumn = columns.find((column) => column.id === draggedColumnId);
    if (!draggedColumn) return;

    const currentTargetId = columnAtPointer(event.clientX);

    if (currentTargetId && currentTargetId !== lastPreviewTargetId) {
      targetColumnId = currentTargetId;
      lastPreviewTargetId = currentTargetId;
      latestPreviewColumns = reorderedColumns(draggedColumnId, currentTargetId);
      onPreviewColumns(latestPreviewColumns);
    }

    onGhostChange({
      column: draggedColumn,
      x: event.clientX - pointerOffsetX,
      y: event.clientY - pointerOffsetY,
      width: ghostWidth
    });
  }

  function handlePointerUp(event: PointerEvent) {
    if (!draggedColumnId) return;

    const element = event.currentTarget as HTMLElement;

    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }

    if (dragStarted) {
      onCommitColumns(latestPreviewColumns.length ? latestPreviewColumns : columns);
    }

    cleanupDrag();
  }

  function handlePointerCancel() {
    onPreviewColumns(dragBaseColumns.length ? dragBaseColumns : columns);
    cleanupDrag();
  }
</script>

<thead class="bg-zinc-950/80">
  <tr>
    {#each columns as column}
      <th
        data-driver-column-id={column.id}
        class={[
          'touch-none select-none border-r border-zinc-800 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-zinc-500 last:border-r-0',
          'cursor-grab active:cursor-grabbing',
          alignClass(column.align),
          draggedColumnId === column.id && dragStarted && 'opacity-30',
          targetColumnId === column.id && dragStarted && 'bg-zinc-800 text-zinc-200'
        ]}
        style={column.width ? `width: ${column.width}` : undefined}
        title="Drag to reorder"
        onpointerdown={(event) => handlePointerDown(event, column)}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerCancel}
      >
        {column.label}
      </th>
    {/each}
  </tr>
</thead>
