import type { UiItem } from '../state/types';
import { errorInfo } from '../state/types';

export function loadItems() {
  return {
    type: loadItems,
    status: 'started' as const,
  };
}

export function loadItemsSuccess(data: UiItem[]) {
  return {
    type: loadItemsSuccess,
    status: 'success' as const,
    data,
  };
}

export function loadItemsFailed(error: unknown) {
  return {
    type: loadItemsFailed,
    status: 'failed' as const,
    error: errorInfo(error),
  };
}
