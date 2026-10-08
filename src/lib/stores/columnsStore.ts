import { derived, writable } from 'svelte/store';
import { driverColumns, type ColumnDefinition, type DriverColumnId } from '../types/columns';

export interface ColumnState {
  id: DriverColumnId;
  visible: boolean;
}

const STORAGE_KEY = 'f1-dashboard.driver-table.columns.v2';

function defaultColumnState(): ColumnState[] {
  return driverColumns.map((column) => ({
    id: column.id,
    visible: column.visibleByDefault
  }));
}

function normalizeColumnState(state: ColumnState[]): ColumnState[] {
  const validIds = new Set(driverColumns.map((column) => column.id));
  const existingIds = new Set(state.map((column) => column.id));

  const existing = state.filter((column) => validIds.has(column.id));

  const missing = driverColumns
    .filter((column) => !existingIds.has(column.id))
    .map((column) => ({
      id: column.id,
      visible: column.visibleByDefault
    }));

  const normalized = [...existing, ...missing];

  if (normalized.some((column) => column.visible)) {
    return normalized;
  }

  const firstColumn = normalized[0];

  if (!firstColumn) {
    return defaultColumnState();
  }

  return [{ ...firstColumn, visible: true }, ...normalized.slice(1)];
}

function loadInitialColumnState(): ColumnState[] {
  if (typeof localStorage === 'undefined') return defaultColumnState();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultColumnState();

  try {
    return normalizeColumnState(JSON.parse(raw));
  } catch {
    return defaultColumnState();
  }
}

function createColumnsStore() {
  const store = writable<ColumnState[]>(loadInitialColumnState());
  const { subscribe, set, update } = store;

  if (typeof localStorage !== 'undefined') {
    subscribe((state) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
  }

  return {
    subscribe,

    toggleColumn(id: DriverColumnId) {
      update((state) => {
        const targetColumn = state.find((column) => column.id === id);
        const visibleCount = state.filter((column) => column.visible).length;

        if (targetColumn?.visible && visibleCount <= 1) {
          return state;
        }

        return state.map((column) =>
          column.id === id ? { ...column, visible: !column.visible } : column
        );
      });
    },

    setColumnVisible(id: DriverColumnId, visible: boolean) {
      update((state) => {
        const targetColumn = state.find((column) => column.id === id);
        const visibleCount = state.filter((column) => column.visible).length;

        if (targetColumn?.visible && !visible && visibleCount <= 1) {
          return state;
        }

        return state.map((column) =>
          column.id === id ? { ...column, visible } : column
        );
      });
    },

    reorderColumn(draggedId: DriverColumnId, targetId: DriverColumnId) {
      update((state) => {
        const draggedIndex = state.findIndex((column) => column.id === draggedId);
        const targetIndex = state.findIndex((column) => column.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
          return state;
        }

        const next = [...state];
        const [draggedColumn] = next.splice(draggedIndex, 1);
        next.splice(targetIndex, 0, draggedColumn);

        return next;
      });
    },

    setVisibleColumnOrder(orderedIds: DriverColumnId[]) {
      update((state) => {
        const orderedIdSet = new Set(orderedIds);
        const orderedVisible = orderedIds
          .map((id) => state.find((column) => column.id === id))
          .filter((column): column is ColumnState => column !== undefined)
          .map((column) => ({ ...column, visible: true }));

        const rest = state.filter((column) => !orderedIdSet.has(column.id));

        return [...orderedVisible, ...rest];
      });
    },

    resetColumns() {
      set(defaultColumnState());
    }
  };
}

export const columnState = createColumnsStore();

export const visibleColumns = derived(columnState, ($columnState) => {
  return $columnState
    .filter((state) => state.visible)
    .map((state) => driverColumns.find((column) => column.id === state.id))
    .filter((column): column is ColumnDefinition => column !== undefined);
});
