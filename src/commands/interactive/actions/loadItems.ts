import { IUiItem, errorInfo } from '../state/types';

export function loadItems() {
  return {
    type: loadItems,
    status: 'started' as const,
  };
}

export function loadItemsSuccess(data: IUiItem[]) {
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
